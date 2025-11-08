import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaf, Recycle, Heart, TrendingUp, Sparkles, ScanLine, Camera, X, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

const Scan = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [barcode, setBarcode] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraScanning, setCameraScanning] = useState(false);
  const [scanMode, setScanMode] = useState<"manual" | "camera">("manual");
  const [scanned, setScanned] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
        return;
      }
      setUserId(session.user.id);
      loadProducts();
    };
    checkAuth();
  }, [navigate]);

  const loadProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("overall_score", { ascending: false });
    setProducts(data || []);
  };

  const handleScan = async () => {
    if (!selectedProduct || !userId) return;

    setScanning(true);
    try {
      // Calculate points (higher score = more points)
      const pointsEarned = Math.round(selectedProduct.overall_score / 2);

      // For demo products, skip database insert but still update profile
      if (!selectedProduct.id.startsWith("demo-")) {
        // Record the scan for real products
        const { error: scanError } = await supabase
          .from("scans")
          .insert({
            user_id: userId,
            product_id: selectedProduct.id,
            points_earned: pointsEarned,
          });

        if (scanError) throw scanError;
      }

      // Update user profile (works for both real and demo products)
      // First, get current profile
      const { data: currentProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("eco_score, total_scans")
        .eq("id", userId)
        .single();

      if (fetchError) {
        console.error("Error fetching profile:", fetchError);
        throw fetchError;
      }

      if (!currentProfile) {
        throw new Error("Profile not found");
      }

      // Calculate new values
      const currentScore = currentProfile.eco_score || 0;
      const currentScans = currentProfile.total_scans || 0;
      const newEcoScore = currentScore + pointsEarned;
      const newTotalScans = currentScans + 1;
      
      console.log(`Updating profile: Current score: ${currentScore}, Adding: ${pointsEarned}, New total: ${newEcoScore}`);
      
      // Update profile with new values
      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({
          eco_score: newEcoScore,
          total_scans: newTotalScans,
        })
        .eq("id", userId)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating profile:", updateError);
        console.error("Update error details:", JSON.stringify(updateError, null, 2));
        throw updateError;
      }
      
      if (updatedProfile) {
        console.log(`✅ Profile updated successfully! New score: ${updatedProfile.eco_score}, New scans: ${updatedProfile.total_scans}`);
      } else {
        console.warn("⚠️ Update succeeded but no data returned");
      }

      toast({
        title: `+${pointsEarned} EcoPoints! 🎉`,
        description: `${selectedProduct.name} scanned successfully. Your total is now ${newEcoScore} points!`,
      });

      // Navigate to dashboard after successful scan
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1500);

      setSelectedProduct(null);
      setBarcode("");
    } catch (error: any) {
      toast({
        title: "Scan failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  const handleBarcodeSearch = () => {
    const product = products.find((p) => p.barcode === barcode);
    if (product) {
      setSelectedProduct(product);
    } else {
      toast({
        title: "Product not found",
        description: "This product is not in our database yet",
        variant: "destructive",
      });
    }
  };

  const stopCameraScan = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      } catch (err) {
        // Ignore stop errors
      }
    }
    setCameraScanning(false);
  };

  // Handle demo scan - generate fake product for demo
  const handleDemoScan = useCallback(async () => {
    // Show scanned animation first
    setScanned(true);
    
    // Wait a bit before showing product details
    setTimeout(async () => {
      const demoBarcode = `DEMO${Date.now()}`;
      const demoProduct = {
        id: `demo-${Date.now()}`,
        barcode: demoBarcode,
        name: "Demo Eco Product",
        carbon_footprint: Math.floor(Math.random() * 30) + 70, // 70-100
        recyclable: true,
        ethical_score: Math.floor(Math.random() * 20) + 80, // 80-100
        overall_score: Math.floor(Math.random() * 15) + 85, // 85-100
      };
      
      setBarcode(demoBarcode);
      setSelectedProduct(demoProduct);
      setScanned(false);
      
      // Automatically record the scan for demo
      if (userId) {
        // Calculate points
        const pointsEarned = Math.round(demoProduct.overall_score / 2);
        
        // Update user profile
        const { data: currentProfile, error: fetchError } = await supabase
          .from("profiles")
          .select("eco_score, total_scans")
          .eq("id", userId)
          .single();

        if (!fetchError && currentProfile) {
          const newEcoScore = (currentProfile.eco_score || 0) + pointsEarned;
          const newTotalScans = (currentProfile.total_scans || 0) + 1;
          
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              eco_score: newEcoScore,
              total_scans: newTotalScans,
            })
            .eq("id", userId)
            .select()
            .single();

          if (!updateError) {
            console.log(`✅ Demo scan recorded: +${pointsEarned} points. New total: ${newEcoScore}`);
            toast({
              title: `+${pointsEarned} EcoPoints! 🎉`,
              description: `${demoProduct.name} scanned successfully. Your total is now ${newEcoScore} points!`,
            });
            
            // Navigate to dashboard after successful scan
            setTimeout(() => {
              navigate("/dashboard", { replace: true });
            }, 1500);
          } else {
            console.error("Error updating profile for demo scan:", updateError);
          }
        }
      }
      
      stopCameraScan();
    }, 2000); // 2 second delay for animation
  }, [toast, userId, navigate]);

  // Handle real barcode detection
  const handleBarcodeDetection = useCallback(async (scannedBarcode: string) => {
    // Show scanned animation first
    setScanned(true);
    
    // Wait a bit before showing product details
    setTimeout(async () => {
      const product = products.find((p) => p.barcode === scannedBarcode);
      if (product) {
        setSelectedProduct(product);
        setScanned(false);
        
        // Automatically record the scan
        if (userId) {
          const pointsEarned = Math.round(product.overall_score / 2);
          
          // Record the scan
          const { error: scanError } = await supabase
            .from("scans")
            .insert({
              user_id: userId,
              product_id: product.id,
              points_earned: pointsEarned,
            });

          if (!scanError) {
            // Update user profile
            const { data: currentProfile, error: fetchError } = await supabase
              .from("profiles")
              .select("eco_score, total_scans")
              .eq("id", userId)
              .single();

            if (!fetchError && currentProfile) {
              const newEcoScore = (currentProfile.eco_score || 0) + pointsEarned;
              const newTotalScans = (currentProfile.total_scans || 0) + 1;
              
              const { error: updateError } = await supabase
                .from("profiles")
                .update({
                  eco_score: newEcoScore,
                  total_scans: newTotalScans,
                })
                .eq("id", userId)
                .select()
                .single();

              if (!updateError) {
                console.log(`✅ Scan recorded: +${pointsEarned} points. New total: ${newEcoScore}`);
                toast({
                  title: `+${pointsEarned} EcoPoints! 🎉`,
                  description: `${product.name} scanned successfully. Your total is now ${newEcoScore} points!`,
                });
                
                // Navigate to dashboard after successful scan
                setTimeout(() => {
                  navigate("/dashboard", { replace: true });
                }, 1500);
              } else {
                console.error("Error updating profile:", updateError);
                toast({
                  title: "Barcode Scanned! 🎉",
                  description: `Found: ${product.name} - Score: ${product.overall_score}/100. Error updating points.`,
                  variant: "destructive",
                });
              }
            } else {
              console.error("Error fetching profile:", fetchError);
              toast({
                title: "Barcode Scanned! 🎉",
                description: `Found: ${product.name} - Score: ${product.overall_score}/100`,
              });
            }
          } else {
            console.error("Error recording scan:", scanError);
            toast({
              title: "Barcode Scanned! 🎉",
              description: `Found: ${product.name} - Score: ${product.overall_score}/100`,
            });
          }
        }
        stopCameraScan();
      } else {
        // Generate demo product if not found
        handleDemoScan();
      }
    }, 2000); // 2 second delay for animation
  }, [products, toast, handleDemoScan, userId, navigate]);

  const startCameraScan = () => {
    // Check if camera is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Camera Error",
        description: "Camera API not available. Please use a modern browser with camera support.",
        variant: "destructive",
      });
      return;
    }

    // Set scanning state - useEffect will handle initialization
    setCameraScanning(true);
  };

  // Initialize camera when element is available - DEMO MODE
  useEffect(() => {
    if (cameraScanning && !html5QrCodeRef.current) {
      const initCamera = async () => {
        // Wait a bit more to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const readerElement = document.getElementById("reader");
        if (!readerElement) {
          console.error("Reader element not found");
          setCameraScanning(false);
          return;
        }

        // DEMO MODE: Auto-detect after 3 seconds or when barcode is found
        let detected = false;
        const demoTimeout = setTimeout(() => {
          if (!detected) {
            // Simulate detection for demo
            handleDemoScan();
            detected = true;
          }
        }, 3000);

        try {
          // Check if camera is available
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            // For demo, simulate detection even without camera
            handleDemoScan();
            return;
          }

          const html5QrCode = new Html5Qrcode("reader");
          html5QrCodeRef.current = html5QrCode;

          // Try to get available cameras first
          let cameras: any[] = [];
          try {
            cameras = await Html5Qrcode.getCameras();
          } catch (camErr) {
            console.log("Could not get camera list, using default", camErr);
          }
          
          // Configuration for barcode scanning - accept all formats
          const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            // Support all barcode formats for demo
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.CODE_93,
              Html5QrcodeSupportedFormats.QR_CODE,
            ],
          };

          // Success callback
          const onScanSuccess = (decodedText: string) => {
            if (!detected) {
              clearTimeout(demoTimeout);
              detected = true;
              setBarcode(decodedText);
              handleBarcodeDetection(decodedText);
              stopCameraScan();
            }
          };

          // Error callback (ignore scanning errors)
          const onScanError = (errorMessage: string) => {
            // Ignore scanning errors (they're frequent during scanning)
          };

          // Try to start with camera ID first, fallback to facingMode
          if (cameras && cameras.length > 0) {
            // Use the first available camera (usually back camera on mobile)
            const cameraId = cameras[0].id;
            await html5QrCode.start(cameraId, config, onScanSuccess, onScanError);
          } else {
            // Fallback to facingMode if camera list is empty
            await html5QrCode.start(
              { facingMode: "environment" },
              config,
              onScanSuccess,
              onScanError
            );
          }
        } catch (err: any) {
          console.error("Camera error:", err);
          
          // For demo, simulate detection even on error
          clearTimeout(demoTimeout);
          if (!detected) {
            handleDemoScan();
            detected = true;
          }
          
          // Clean up on error
          if (html5QrCodeRef.current) {
            try {
              await html5QrCodeRef.current.stop().catch(() => {});
              await html5QrCodeRef.current.clear().catch(() => {});
              html5QrCodeRef.current = null;
            } catch (cleanupErr) {
              // Ignore cleanup errors
            }
          }
        }
      };

      initCamera();
    }

    return () => {
      if (html5QrCodeRef.current && !cameraScanning) {
        stopCameraScan();
      }
    };
  }, [cameraScanning, handleDemoScan, handleBarcodeDetection]);

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-primary";
    if (score >= 50) return "text-eco-gold";
    return "text-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 75) return "Excellent";
    if (score >= 50) return "Good";
    return "Needs Improvement";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-orange-50/30 to-orange-50 pb-24">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="pt-6 pb-4">
          <h1 className="text-4xl font-extrabold text-foreground flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-green-400 to-green-500 shadow-lg">
              <ScanLine className="w-8 h-8 text-white" />
            </div>
            Scan Product
          </h1>
          <p className="text-muted-foreground text-lg">Discover the eco-impact of your choices 🌱</p>
        </div>

        {/* Barcode Scanner */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <ScanLine className="w-6 h-6 text-primary" />
              Scan Product Barcode
            </CardTitle>
            <CardDescription className="text-base">Use your camera or enter barcode manually to view sustainability data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={scanMode} onValueChange={(value) => {
              setScanMode(value as "manual" | "camera");
              if (value === "manual" && cameraScanning) {
                stopCameraScan();
              }
            }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <ScanLine className="w-4 h-4" />
                  Manual Entry
                </TabsTrigger>
                <TabsTrigger value="camera" className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Camera Scan
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-4 mt-4">
                <div className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="barcode">Barcode Number</Label>
                    <Input
                      id="barcode"
                      placeholder="Enter barcode (e.g., 8901030778261)"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleBarcodeSearch();
                        }
                      }}
                    />
                  </div>
                  <Button 
                    onClick={handleBarcodeSearch} 
                    className="self-end bg-gradient-earth"
                  >
                    Search
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="camera" className="space-y-4 mt-4">
                {!cameraScanning ? (
                  <div className="space-y-4">
                    <div className="relative aspect-square max-w-md mx-auto bg-muted rounded-2xl overflow-hidden border-2 border-dashed border-primary/30">
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                        <Camera className="w-16 h-16 text-muted-foreground mb-4" />
                        <p className="text-center text-muted-foreground mb-2">
                          Click the button below to start scanning
                        </p>
                        <p className="text-center text-xs text-muted-foreground/70 px-4">
                          Make sure to allow camera permissions when prompted
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={startCameraScan}
                      className="w-full bg-gradient-to-br from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white h-14 text-lg shadow-lg hover:shadow-xl transition-all rounded-2xl"
                      size="lg"
                    >
                      <Camera className="w-6 h-6 mr-2" />
                      Start Camera Scanner
                    </Button>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
                      <p className="font-semibold mb-1">💡 Tips:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Ensure good lighting for better scanning</li>
                        <li>Hold the barcode steady in front of the camera</li>
                        <li>Make sure the barcode is clear and not damaged</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative aspect-square max-w-md mx-auto bg-black rounded-2xl overflow-hidden">
                      <div id="reader" className="w-full h-full"></div>
                      <Button
                        onClick={stopCameraScan}
                        variant="destructive"
                        size="icon"
                        className="absolute top-4 right-4 z-10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      
                      {/* Scanned Success Overlay */}
                      {scanned && (
                        <div className="absolute inset-0 bg-green-500/95 backdrop-blur-sm flex flex-col items-center justify-center z-20 animate-in fade-in duration-300">
                          <div className="bg-white rounded-full p-6 mb-4 animate-in zoom-in duration-500">
                            <CheckCircle2 className="w-16 h-16 text-green-500" />
                          </div>
                          <h3 className="text-3xl font-bold text-white mb-2 animate-in slide-in-from-bottom-4 duration-500">
                            Scanned! ✓
                          </h3>
                          <p className="text-white/90 text-lg animate-in slide-in-from-bottom-4 duration-700 delay-200">
                            Processing product...
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                      {scanned ? "Processing..." : "Point your camera at a barcode to scan"}
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or select from list</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product">Choose Product</Label>
              <Select onValueChange={(value) => {
                const product = products.find(p => p.id === value);
                setSelectedProduct(product);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - Score: {product.overall_score}/100
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Product Details */}
        {selectedProduct && (
          <Card className="shadow-eco border-primary/20 animate-in fade-in-50 duration-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{selectedProduct.name}</CardTitle>
                  <CardDescription>Barcode: {selectedProduct.barcode}</CardDescription>
                </div>
                <Badge 
                  className={`text-2xl px-4 py-2 ${
                    selectedProduct.overall_score >= 75 
                      ? "bg-gradient-success" 
                      : selectedProduct.overall_score >= 50 
                      ? "bg-gradient-gold" 
                      : "bg-destructive"
                  }`}
                >
                  {selectedProduct.overall_score}/100
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overall Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Sustainability Score
                  </h3>
                  <span className={`font-bold ${getScoreColor(selectedProduct.overall_score)}`}>
                    {getScoreLabel(selectedProduct.overall_score)}
                  </span>
                </div>
                <Progress value={selectedProduct.overall_score} className="h-3" />
              </div>

              {/* Detailed Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 mb-2">
                    <Leaf className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold">Carbon Footprint</h4>
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {selectedProduct.carbon_footprint}/100
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Environmental impact</p>
                </div>

                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 mb-2">
                    <Recycle className="w-5 h-5 text-eco-blue" />
                    <h4 className="font-semibold">Recyclability</h4>
                  </div>
                  <div className="text-3xl font-bold text-eco-blue">
                    {selectedProduct.recyclable ? "Yes" : "No"}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedProduct.recyclable ? "Eco-friendly packaging" : "Non-recyclable"}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-5 h-5 text-eco-gold" />
                    <h4 className="font-semibold">Ethical Score</h4>
                  </div>
                  <div className="text-3xl font-bold text-eco-gold">
                    {selectedProduct.ethical_score}/100
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Fair trade & sourcing</p>
                </div>
              </div>

              {/* Scan Button */}
              <Button 
                onClick={handleScan} 
                disabled={scanning}
                className="w-full h-14 text-lg bg-gradient-earth hover:opacity-90"
                size="lg"
              >
                {scanning ? (
                  <>
                    <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    Recording Scan...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Record Scan & Earn Points
                  </>
                )}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                You'll earn {Math.round(selectedProduct.overall_score / 2)} EcoPoints for this scan
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default Scan;
