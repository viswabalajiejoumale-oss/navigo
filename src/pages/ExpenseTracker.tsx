import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { getFuelPrices, reportFuelPrice } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Wallet,
  TrendingDown,
  Bus,
  Car,
  TrainFront,
  Plane,
  Train,
  Plus,
  IndianRupee,
  Sparkles,
  PieChart,
  Fuel,
  BellRing,
  AlertTriangle,
  Leaf,
  TrendingUp,
} from "lucide-react";

const DEMO_EXPENSES = [
  {
    id: "1",
    mode: "taxi",
    from: "Home",
    to: "Office",
    cost: 250,
    date: new Date("2024-01-15"),
  },
  {
    id: "2",
    mode: "metro",
    from: "Office",
    to: "Mall",
    cost: 40,
    date: new Date("2024-01-15"),
  },
  {
    id: "3",
    mode: "bus",
    from: "Mall",
    to: "Home",
    cost: 25,
    date: new Date("2024-01-15"),
  },
  {
    id: "4",
    mode: "taxi",
    from: "Home",
    to: "Airport",
    cost: 650,
    date: new Date("2024-01-14"),
  },
  {
    id: "5",
    mode: "metro",
    from: "Station",
    to: "Office",
    cost: 45,
    date: new Date("2024-01-14"),
  },
];

const iconMap: Record<string, React.ElementType> = {
  bus: Bus,
  taxi: Car,
  metro: TrainFront,
  airport: Plane,
  railway: Train,
};

const FUEL_SERIES = [103.2, 103.7, 104.1, 104.9, 105.4, 106.1, 106.7];

const EMISSION_PER_TRIP: Record<string, number> = {
  taxi: 2.8,
  bus: 1.2,
  metro: 0.6,
  railway: 0.8,
  airport: 4.9,
};

const ExpenseTracker = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExpense, setNewExpense] = useState({
    mode: "",
    from: "",
    to: "",
    cost: "",
  });
  const [fuelForm, setFuelForm] = useState({
    liters: "",
    currentPrice: "",
    alertPrice: "",
  });
  const [fuelAlertRaised, setFuelAlertRaised] = useState(false);
  const [fuelStop, setFuelStop] = useState("City Fuel Hub");
  const [weeklyFuel, setWeeklyFuel] = useState<{
    latest: number;
    weeklyLow: number;
    isWeeklyLowNow: boolean;
  } | null>(null);

  const allExpenses = [...DEMO_EXPENSES, ...state.expenses].map((expense) => ({
    ...expense,
    cost: Number((expense as any).cost ?? (expense as any).amount ?? 0),
    date: new Date((expense as any).date),
  }));

  const totalSpent = allExpenses.reduce((sum, e) => sum + e.cost, 0);
  const taxiSpent = allExpenses
    .filter((e) => e.mode === "taxi")
    .reduce((sum, e) => sum + e.cost, 0);
  const metroSpent = allExpenses
    .filter((e) => e.mode === "metro")
    .reduce((sum, e) => sum + e.cost, 0);
  const busSpent = allExpenses
    .filter((e) => e.mode === "bus")
    .reduce((sum, e) => sum + e.cost, 0);

  // Calculate potential savings
  const potentialSavings = Math.round(taxiSpent * 0.7);

  const fuelSlope = useMemo(() => {
    const start = FUEL_SERIES[0];
    const end = FUEL_SERIES[FUEL_SERIES.length - 1];
    return (end - start) / FUEL_SERIES.length;
  }, []);

  const predictedPriceTomorrow = useMemo(() => {
    const latest =
      Number(fuelForm.currentPrice) || FUEL_SERIES[FUEL_SERIES.length - 1];
    return Number((latest + Math.max(fuelSlope, 0.35)).toFixed(2));
  }, [fuelForm.currentPrice, fuelSlope]);

  const potentialFuelCost = useMemo(() => {
    const liters = Number(fuelForm.liters) || 0;
    return Number((liters * predictedPriceTomorrow).toFixed(2));
  }, [fuelForm.liters, predictedPriceTomorrow]);

  const ecoSummary = useMemo(() => {
    const modeCounts = allExpenses.reduce<Record<string, number>>(
      (acc, expense) => {
        acc[expense.mode] = (acc[expense.mode] || 0) + 1;
        return acc;
      },
      {},
    );

    const taxiTrips = modeCounts.taxi || 0;
    const suggestedShiftTrips = Math.max(1, Math.round(taxiTrips * 0.3));
    const avgTaxi = taxiTrips > 0 ? taxiSpent / taxiTrips : 0;
    const avgMetro =
      (modeCounts.metro || 0) > 0 ? metroSpent / modeCounts.metro : 45;
    const estimatedSavings = Math.round(
      Math.max(0, (avgTaxi - avgMetro) * suggestedShiftTrips),
    );

    const baselineEmission = allExpenses.reduce((sum, expense) => {
      return sum + (EMISSION_PER_TRIP[expense.mode] || 1.5);
    }, 0);

    const optimizedEmission = Math.max(
      0,
      baselineEmission -
        suggestedShiftTrips *
          ((EMISSION_PER_TRIP.taxi || 0) - (EMISSION_PER_TRIP.metro || 0)),
    );
    const reduction =
      baselineEmission > 0
        ? Math.round(
            ((baselineEmission - optimizedEmission) / baselineEmission) * 100,
          )
        : 0;

    return { estimatedSavings, reduction };
  }, [allExpenses, metroSpent, taxiSpent]);

  useEffect(() => {
    let active = true;
    const loadFuelInsights = async () => {
      try {
        const insight = await getFuelPrices(fuelStop);
        if (!active) return;
        setWeeklyFuel({
          latest: insight.latest,
          weeklyLow: insight.weeklyLow,
          isWeeklyLowNow: insight.isWeeklyLowNow,
        });
      } catch {
        if (!active) return;
        setWeeklyFuel(null);
      }
    };

    loadFuelInsights();
    return () => {
      active = false;
    };
  }, [fuelStop]);

  useEffect(() => {
    const threshold = Number(fuelForm.alertPrice);
    if (!threshold || Number.isNaN(threshold)) {
      setFuelAlertRaised(false);
      return;
    }
    const shouldAlert = predictedPriceTomorrow >= threshold;
    if (shouldAlert && !fuelAlertRaised && "vibrate" in navigator) {
      navigator.vibrate([120, 60, 120]);
    }
    setFuelAlertRaised(shouldAlert);
  }, [fuelAlertRaised, fuelForm.alertPrice, predictedPriceTomorrow]);

  const handleAddExpense = () => {
    if (
      newExpense.mode &&
      newExpense.from &&
      newExpense.to &&
      newExpense.cost
    ) {
      dispatch({
        type: "ADD_EXPENSE",
        payload: {
          id: Date.now().toString(),
          mode: newExpense.mode,
          from: newExpense.from,
          to: newExpense.to,
          cost: Number(newExpense.cost),
          date: new Date(),
        },
      });
      setNewExpense({ mode: "", from: "", to: "", cost: "" });
      setShowAddForm(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-xl px-4 py-4 safe-area-top"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-xl"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-heading-2 font-bold">Expense Tracker</h1>
            <p className="text-body-sm text-muted-foreground">
              Track your travel spending
            </p>
          </div>
        </div>
      </motion.header>

      <main className="container max-w-2xl px-4 py-6">
        {/* Summary cards */}
        <motion.div
          className="grid grid-cols-2 gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-5 w-5" />
                <span className="text-body-sm opacity-80">Total Spent</span>
              </div>
              <p className="text-heading-1 font-bold flex items-center">
                <IndianRupee className="h-6 w-6" />
                {totalSpent}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success to-success/80 text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-5 w-5" />
                <span className="text-body-sm opacity-80">Can Save</span>
              </div>
              <p className="text-heading-1 font-bold flex items-center">
                <IndianRupee className="h-6 w-6" />
                {potentialSavings}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Suggestion */}
        <motion.div
          className="mb-6 rounded-xl bg-accent/10 border border-accent/30 p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-start gap-3">
            <Sparkles className="h-6 w-6 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-label font-semibold mb-1">Smart Suggestion</p>
              <p className="text-body-md text-muted-foreground">
                You spent ₹{taxiSpent} on Taxis this week. Taking the Metro
                instead would save you approximately ₹{potentialSavings}!
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <Card className="border-success/30 bg-success/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Leaf className="h-5 w-5 text-success mt-1" />
                <div>
                  <p className="text-label font-semibold">
                    Eco-Budget Optimization
                  </p>
                  <p className="text-body-sm text-muted-foreground">
                    Switching to Metro on Tuesdays could save you ₹
                    {ecoSummary.estimatedSavings} this month and reduce your
                    carbon footprint by {ecoSummary.reduction}%.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-heading-3 flex items-center gap-2">
                <Fuel className="h-5 w-5 text-primary" />
                Fuel-Lock Predictor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Frequent Fuel Stop</Label>
                  <Input
                    className="h-12 mt-1"
                    placeholder="Fuel stop"
                    value={fuelStop}
                    onChange={(e) => setFuelStop(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Liters Needed</Label>
                  <Input
                    className="h-12 mt-1"
                    type="number"
                    placeholder="e.g. 8"
                    value={fuelForm.liters}
                    onChange={(e) =>
                      setFuelForm({ ...fuelForm, liters: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Current Price (₹/L)</Label>
                  <Input
                    className="h-12 mt-1"
                    type="number"
                    placeholder="e.g. 106.4"
                    value={fuelForm.currentPrice}
                    onChange={(e) =>
                      setFuelForm({ ...fuelForm, currentPrice: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Alert Price (₹/L)</Label>
                  <Input
                    className="h-12 mt-1"
                    type="number"
                    placeholder="Alert threshold"
                    value={fuelForm.alertPrice}
                    onChange={(e) =>
                      setFuelForm({ ...fuelForm, alertPrice: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="rounded-xl border bg-muted/30 p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-body-sm text-muted-foreground">
                    Weekly Low Watch
                  </p>
                  <p className="text-label font-semibold">
                    {weeklyFuel
                      ? `₹${weeklyFuel.latest} now • Low ₹${weeklyFuel.weeklyLow}`
                      : "Price data unavailable"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="h-10 gap-2"
                  onClick={async () => {
                    const observedPrice = Number(
                      fuelForm.currentPrice || predictedPriceTomorrow,
                    );
                    if (!fuelStop || !Number.isFinite(observedPrice)) return;
                    await reportFuelPrice({
                      stop: fuelStop,
                      price: observedPrice,
                      source: "crowd",
                    });
                    const refreshed = await getFuelPrices(fuelStop);
                    setWeeklyFuel({
                      latest: refreshed.latest,
                      weeklyLow: refreshed.weeklyLow,
                      isWeeklyLowNow: refreshed.isWeeklyLowNow,
                    });
                  }}
                >
                  <TrendingUp className="h-4 w-4" />
                  Share Price
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="text-body-sm text-muted-foreground">
                    Predicted Tomorrow Price
                  </p>
                  <p className="text-heading-3 font-bold text-primary">
                    ₹{predictedPriceTomorrow}/L
                  </p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="text-body-sm text-muted-foreground">
                    Estimated Fill Cost
                  </p>
                  <p className="text-heading-3 font-bold">
                    ₹{potentialFuelCost || "--"}
                  </p>
                </div>
              </div>

              {fuelAlertRaised || weeklyFuel?.isWeeklyLowNow ? (
                <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                  <p className="text-body-sm text-warning-foreground">
                    {weeklyFuel?.isWeeklyLowNow
                      ? "Petrol is at weekly low near your frequent stop. Best refill window is active."
                      : "Fuel-Lock Alert: forecast has crossed your limit. Refill early to avoid a price spike."}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-success/30 bg-success/10 p-3 flex items-start gap-3">
                  <BellRing className="h-5 w-5 text-success mt-0.5" />
                  <p className="text-body-sm text-success">
                    Price is below your alert cap. Fuel-Lock will notify you on
                    spikes.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Breakdown by mode */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-heading-3 font-bold mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            Spending by Mode
          </h2>
          <div className="space-y-3">
            {[
              {
                mode: "taxi",
                label: "Taxi",
                amount: taxiSpent,
                color: "bg-transport-taxi",
              },
              {
                mode: "metro",
                label: "Metro",
                amount: metroSpent,
                color: "bg-transport-metro",
              },
              {
                mode: "bus",
                label: "Bus",
                amount: busSpent,
                color: "bg-transport-bus",
              },
            ].map((item) => {
              const percentage =
                totalSpent > 0 ? (item.amount / totalSpent) * 100 : 0;
              const IconComponent = iconMap[item.mode];
              return (
                <div key={item.mode} className="flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}
                  >
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-label font-medium">
                        {item.label}
                      </span>
                      <span className="text-body-sm font-semibold">
                        ₹{item.amount}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        className={`h-full ${item.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Add expense button */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {!showAddForm ? (
            <Button
              className="w-full h-14 gap-2"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-5 w-5" />
              Add New Expense
            </Button>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-heading-3">Add Expense</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Transport Mode</Label>
                  <Select
                    value={newExpense.mode}
                    onValueChange={(value) =>
                      setNewExpense({ ...newExpense, mode: value })
                    }
                  >
                    <SelectTrigger className="h-12 mt-1">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bus">Bus</SelectItem>
                      <SelectItem value="taxi">Taxi</SelectItem>
                      <SelectItem value="metro">Metro</SelectItem>
                      <SelectItem value="railway">Railway</SelectItem>
                      <SelectItem value="airport">Airport</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>From</Label>
                    <Input
                      className="h-12 mt-1"
                      placeholder="Start location"
                      value={newExpense.from}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, from: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>To</Label>
                    <Input
                      className="h-12 mt-1"
                      placeholder="End location"
                      value={newExpense.to}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, to: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Cost (₹)</Label>
                  <Input
                    className="h-12 mt-1"
                    type="number"
                    placeholder="Enter amount"
                    value={newExpense.cost}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, cost: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-12"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button className="flex-1 h-12" onClick={handleAddExpense}>
                    Add Expense
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Recent expenses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-heading-3 font-bold mb-4">Recent Trips</h2>
          <div className="space-y-3">
            {allExpenses.slice(0, 10).map((expense, index) => {
              const IconComponent = iconMap[expense.mode] || Bus;
              return (
                <motion.div
                  key={expense.id}
                  className="flex items-center gap-4 rounded-xl border p-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-secondary`}
                  >
                    <IconComponent className="h-6 w-6 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-label font-semibold">
                      {expense.from} → {expense.to}
                    </p>
                    <p className="text-body-sm text-muted-foreground capitalize">
                      {expense.mode} • {expense.date.toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-heading-3 font-bold text-foreground flex items-center">
                    <IndianRupee className="h-4 w-4" />
                    {expense.cost}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default ExpenseTracker;
