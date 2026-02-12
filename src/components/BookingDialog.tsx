import { useMemo, useState } from "react";
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

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modeName: string;
}

const BookingDialog = ({ open, onOpenChange, modeName }: BookingDialogProps) => {
  const [step, setStep] = useState<"details" | "otp" | "confirmed">("details");
  const [phone, setPhone] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");

  const canSendOtp = pickup.trim() && dropoff.trim() && phone.trim().length >= 8;

  const demoOtp = useMemo(() => generatedOtp || "", [generatedOtp]);

  const handleSendOtp = () => {
    const nextOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(nextOtp);
    setStep("otp");
  };

  const handleVerify = () => {
    if (otp.trim() === generatedOtp) {
      setStep("confirmed");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep("details");
    setPhone("");
    setPickup("");
    setDropoff("");
    setPaymentMethod("upi");
    setOtp("");
    setGeneratedOtp("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Book {modeName}</DialogTitle>
          <DialogDescription>
            Demo booking flow with phone verification and payment choice.
          </DialogDescription>
        </DialogHeader>

        {step === "details" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="Pickup location"
              />
              <Input
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
                placeholder="Drop location"
              />
            </div>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
            />
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
            <Button className="w-full" disabled={!canSendOtp} onClick={handleSendOtp}>
              Send OTP
            </Button>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <p className="text-body-sm text-muted-foreground">
              Enter the 6-digit OTP sent to your phone.
            </p>
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="OTP"
            />
            {demoOtp && (
              <div className="rounded-lg border bg-muted p-3 text-sm">
                Demo OTP: <span className="font-semibold">{demoOtp}</span>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("details")}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleVerify}>
                Verify
              </Button>
            </div>
          </div>
        )}

        {step === "confirmed" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-success/30 bg-success/10 p-4">
              <p className="text-body-md font-semibold">Booking confirmed</p>
              <p className="text-body-sm text-muted-foreground">
                {modeName} has been booked successfully.
              </p>
            </div>
            <Button className="w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
