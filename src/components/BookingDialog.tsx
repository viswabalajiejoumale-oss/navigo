import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin, CreditCard, Wallet, Banknote, Scan, Users, Info, CheckCircle2, ArrowRight, Star, TrendingDown } from "lucide-react";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modeName: string;
}

const BookingDialog = ({ open, onOpenChange, modeName }: BookingDialogProps) => {
  const [step, setStep] = useState<"details" | "schedule" | "seats" | "payment" | "otp" | "confirmed">("details");
  const [phone, setPhone] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState("09:00");
  const [passengers, setPassengers] = useState("1");
  const [seatPreference, setSeatPreference] = useState("any");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [fareEstimate, setFareEstimate] = useState(0);
  const [distance, setDistance] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Calculate fare estimate based on inputs
  useEffect(() => {
    if (pickup && dropoff) {
      const baseDistance = Math.random() * 50 + 5; // 5-55 km
      setDistance(parseFloat(baseDistance.toFixed(1)));
      
      let baseFare = 0;
      if (modeName.toLowerCase().includes('bus')) baseFare = baseDistance * 2;
      else if (modeName.toLowerCase().includes('train')) baseFare = baseDistance * 1.5;
      else if (modeName.toLowerCase().includes('metro')) baseFare = baseDistance * 2.5;
      else if (modeName.toLowerCase().includes('taxi')) baseFare = baseDistance * 15;
      else if (modeName.toLowerCase().includes('flight')) baseFare = baseDistance * 50;
      else baseFare = baseDistance * 3;
      
      const passengerCount = parseInt(passengers) || 1;
      setFareEstimate(parseFloat((baseFare * passengerCount).toFixed(2)));
    }
  }, [pickup, dropoff, passengers, modeName]);

  const canProceedToSchedule = pickup.trim() && dropoff.trim() && phone.trim().length >= 10;
  const canProceedToSeats = date && time;
  const canProceedToPayment = seatPreference && passengers;

  const demoOtp = useMemo(() => generatedOtp || "", [generatedOtp]);

  const handleProceedToSchedule = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setStep("schedule");
      setIsAnimating(false);
    }, 300);
  };

  const handleProceedToSeats = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setStep("seats");
      setIsAnimating(false);
    }, 300);
  };

  const handleProceedToPayment = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setStep("payment");
      setIsAnimating(false);
    }, 300);
  };

  const handleSendOtp = () => {
    const nextOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(nextOtp);
    setIsAnimating(true);
    setTimeout(() => {
      setStep("otp");
      setIsAnimating(false);
    }, 300);
  };

  const handleVerify = () => {
    if (otp.trim() === generatedOtp) {
      setIsAnimating(true);
      setTimeout(() => {
        setStep("confirmed");
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("details");
      setPhone("");
      setPickup("");
      setDropoff("");
      setDate(new Date().toISOString().split('T')[0]);
      setTime("09:00");
      setPassengers("1");
      setSeatPreference("any");
      setPaymentMethod("upi");
      setOtp("");
      setGeneratedOtp("");
      setFareEstimate(0);
      setDistance(0);
    }, 200);
  };

  const paymentIcons: any = {
    upi: <Scan className="w-5 h-5" />,
    card: <CreditCard className="w-5 h-5" />,
    wallet: <Wallet className="w-5 h-5" />,
    cash: <Banknote className="w-5 h-5" />,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-2xl transition-all duration-300 ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-blue-900">Book {modeName}</DialogTitle>
              <DialogDescription className="text-blue-700">
                Complete your journey in a few simple steps
              </DialogDescription>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-900 border-blue-200">
              Step {step === "details" ? "1" : step === "schedule" ? "2" : step === "seats" ? "3" : step === "payment" ? "4" : step === "otp" ? "5" : "6"}/6
            </Badge>
          </div>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="w-full bg-blue-100 rounded-full h-2 mb-4">
          <div 
            className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full transition-all duration-500"
            style={{ 
              width: `${
                step === "details" ? 16.67 : 
                step === "schedule" ? 33.33 : 
                step === "seats" ? 50 : 
                step === "payment" ? 66.67 : 
                step === "otp" ? 83.33 : 100
              }%` 
            }}
          />
        </div>

        {/* Step 1: Journey Details */}
        {step === "details" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-5 duration-500">
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Journey Details</h3>
                </div>
                <div className="space-y-3">
                  <div className="relative">
                    <Input
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      placeholder="Pickup location"
                      className="pl-4 pr-10 border-blue-200 focus:border-blue-600 text-blue-900 font-medium"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow" />
                  </div>
                  <div className="flex justify-center">
                    <ArrowRight className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="relative">
                    <Input
                      value={dropoff}
                      onChange={(e) => setDropoff(e.target.value)}
                      placeholder="Drop location"
                      className="pl-4 pr-10 border-blue-200 focus:border-blue-600 text-blue-900 font-medium"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Contact Information</h3>
                </div>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number (+91XXXXXXXXXX)"
                  className="border-blue-200 focus:border-blue-600 text-blue-900 font-medium"
                  type="tel"
                />
              </CardContent>
            </Card>

            {fareEstimate > 0 && (
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white animate-in slide-in-from-bottom-3">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700 flex items-center gap-1">
                        <TrendingDown className="w-4 h-4" />
                        Estimated Fare
                      </p>
                      <p className="text-3xl font-bold text-green-900">₹{fareEstimate}</p>
                      <p className="text-xs text-green-600">{distance} km • {parseInt(passengers)} passenger(s)</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <Star className="w-3 h-3 mr-1" />
                        Best Price
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all" 
              disabled={!canProceedToSchedule} 
              onClick={handleProceedToSchedule}
            >
              Continue to Schedule
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: Date & Time Selection */}
        {step === "schedule" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-5 duration-500">
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">When do you want to travel?</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-blue-700 font-medium mb-2 block">Travel Date</label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="border-blue-200 focus:border-blue-600 text-blue-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-blue-700 font-medium mb-2 block">Departure Time</label>
                    <div className="relative">
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="border-blue-200 focus:border-blue-600 text-blue-900 font-medium"
                      />
                      <Clock className="w-4 h-4 text-blue-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Number of Passengers</h3>
                </div>
                <Select value={passengers} onValueChange={setPassengers}>
                  <SelectTrigger className="border-blue-200 focus:border-blue-600 text-blue-900 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <SelectItem key={num} value={num.toString()}>{num} Passenger{num > 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 border-blue-200 text-blue-900 hover:bg-blue-50"
                onClick={() => setStep("details")}
              >
                Back
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-lg"
                disabled={!canProceedToSeats}
                onClick={handleProceedToSeats}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Seat Selection */}
        {step === "seats" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-5 duration-500">
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Seat Preference</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {['any', 'window', 'aisle', 'front'].map((pref) => (
                    <button
                      key={pref}
                      onClick={() => setSeatPreference(pref)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        seatPreference === pref
                          ? 'border-blue-600 bg-blue-100 shadow-md'
                          : 'border-blue-200 bg-white hover:border-blue-400'
                      }`}
                    >
                      <p className="font-semibold text-blue-900 capitalize">{pref}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        {pref === 'any' && 'No preference'}
                        {pref === 'window' && 'Scenic view'}
                        {pref === 'aisle' && 'Easy access'}
                        {pref === 'front' && 'Quick exit'}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-amber-800">
                  <Info className="w-4 h-4" />
                  <p className="text-sm font-medium">
                    Seat allocation is subject to availability at the time of booking
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 border-blue-200 text-blue-900 hover:bg-blue-50"
                onClick={() => setStep("schedule")}
              >
                Back
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-lg"
                disabled={!canProceedToPayment}
                onClick={handleProceedToPayment}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Payment Method */}
        {step === "payment" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-5 duration-500">
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Choose Payment Method</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'upi', label: 'UPI', desc: 'Google Pay, PhonePe' },
                    { value: 'card', label: 'Card', desc: 'Credit/Debit' },
                    { value: 'wallet', label: 'Wallet', desc: 'Paytm, Amazon' },
                    { value: 'cash', label: 'Cash', desc: 'Pay on arrival' },
                  ].map((method) => (
                    <button
                      key={method.value}
                      onClick={() => setPaymentMethod(method.value)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        paymentMethod === method.value
                          ? 'border-blue-600 bg-blue-100 shadow-md'
                          : 'border-blue-200 bg-white hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {paymentIcons[method.value]}
                        <p className="font-semibold text-blue-900">{method.label}</p>
                      </div>
                      <p className="text-xs text-blue-600">{method.desc}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-gradient-to-br from-green-50 via-white to-blue-50">
              <CardContent className="p-5">
                <h3 className="font-bold text-lg text-blue-900 mb-3">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">From:</span>
                    <span className="font-semibold text-blue-900">{pickup}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">To:</span>
                    <span className="font-semibold text-blue-900">{dropoff}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Date & Time:</span>
                    <span className="font-semibold text-blue-900">{date} at {time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Passengers:</span>
                    <span className="font-semibold text-blue-900">{passengers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Distance:</span>
                    <span className="font-semibold text-blue-900">{distance} km</span>
                  </div>
                  <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between items-center">
                    <span className="text-blue-900 font-bold text-base">Total Fare:</span>
                    <span className="text-green-600 font-bold text-2xl">₹{fareEstimate}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 border-blue-200 text-blue-900 hover:bg-blue-50"
                onClick={() => setStep("seats")}
              >
                Back
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-lg"
                onClick={handleSendOtp}
              >
                Proceed to Pay
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: OTP Verification */}
        {step === "otp" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-5 duration-500">
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scan className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-bold text-xl text-blue-900 mb-2">Verify Your Phone</h3>
                <p className="text-sm text-blue-600 mb-4">
                  Enter the 6-digit OTP sent to {phone}
                </p>
                <Input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="text-center text-2xl font-bold tracking-widest border-blue-200 focus:border-blue-600 text-blue-900"
                  maxLength={6}
                />
              </CardContent>
            </Card>

            {demoOtp && (
              <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white animate-pulse">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-amber-700 mb-1 font-medium">Demo Mode</p>
                  <p className="text-3xl font-bold text-amber-900 tracking-wider">{demoOtp}</p>
                  <p className="text-xs text-amber-600 mt-1">Use this OTP for testing</p>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 border-blue-200 text-blue-900 hover:bg-blue-50"
                onClick={() => setStep("payment")}
              >
                Back
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-lg"
                onClick={handleVerify}
                disabled={otp.length !== 6}
              >
                Verify & Book
                <CheckCircle2 className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 6: Confirmation */}
        {step === "confirmed" && (
          <div className="space-y-5 animate-in fade-in zoom-in duration-700">
            <Card className="border-green-300 bg-gradient-to-br from-green-50 via-green-100 to-blue-50">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-1000">
                  <CheckCircle2 className="w-12 h-12 text-green-600 animate-in zoom-in delay-200" />
                </div>
                <h3 className="font-bold text-2xl text-green-900 mb-2">Booking Confirmed!</h3>
                <p className="text-green-700 mb-4">
                  Your {modeName} has been successfully booked
                </p>
                <div className="bg-white/80 backdrop-blur rounded-lg p-4 text-left space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booking ID:</span>
                    <span className="font-bold text-blue-900">NV{Math.floor(100000 + Math.random() * 900000)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Route:</span>
                    <span className="font-semibold text-blue-900">{pickup} → {dropoff}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Journey:</span>
                    <span className="font-semibold text-blue-900">{date} at {time}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-gray-600">Total Paid:</span>
                    <span className="font-bold text-green-600 text-lg">₹{fareEstimate}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Confirmation sent to {phone}
                </p>
              </CardContent>
            </Card>

            <Button 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-6 shadow-lg"
              onClick={handleClose}
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
