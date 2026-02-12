import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
	ArrowLeft,
	User,
	Wallet,
	FileText,
	AlertTriangle,
	MessageSquare,
	Moon,
	Sun,
	Accessibility,
	Shield,
} from "lucide-react";

const Settings = () => {
	const navigate = useNavigate();
	const { state, dispatch } = useApp();
	const [issueText, setIssueText] = useState("");
	const [feedbackText, setFeedbackText] = useState("");

	const handleSubmitIssue = () => {
		if (!issueText.trim()) return;
		console.log("Issue submitted:", issueText);
		setIssueText("");
	};

	const handleSubmitFeedback = () => {
		if (!feedbackText.trim()) return;
		console.log("Feedback submitted:", feedbackText);
		setFeedbackText("");
	};

	return (
		<div className="min-h-screen bg-background pb-10">
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
						<h1 className="text-heading-2 font-bold">Settings</h1>
						<p className="text-body-sm text-muted-foreground">
							Profile, preferences, and support
						</p>
					</div>
				</div>
			</motion.header>

			<main className="container max-w-2xl px-4 py-6 space-y-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-heading-3">
							<User className="h-5 w-5 text-primary" />
							Profile
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<label className="text-body-sm text-muted-foreground">Name</label>
							<Input value={state.userProfile?.name || ""} placeholder="Your name" readOnly />
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="text-body-sm text-muted-foreground">Age</label>
								<Input value={state.userProfile?.age || ""} placeholder="Age" readOnly />
							</div>
							<div>
								<label className="text-body-sm text-muted-foreground">Mobility</label>
								<Input value={state.userProfile?.mobilityNeeds || ""} placeholder="Mobility needs" readOnly />
							</div>
						</div>
						<div>
							<label className="text-body-sm text-muted-foreground">Preferences</label>
							<Input value={state.userProfile?.preferences || ""} placeholder="Travel preferences" readOnly />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-heading-3">
							<Wallet className="h-5 w-5 text-primary" />
							Expenses
						</CardTitle>
					</CardHeader>
					<CardContent className="flex items-center justify-between">
						<div>
							<p className="text-body-sm text-muted-foreground">Trips recorded</p>
							<p className="text-heading-3 font-bold">{state.expenses.length}</p>
						</div>
						<Button variant="outline" onClick={() => navigate("/expenses")}>View</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-heading-3">
							<FileText className="h-5 w-5 text-primary" />
							Reports
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<Button className="w-full" variant="outline">Weekly summary</Button>
						<Button className="w-full" variant="outline">Monthly travel report</Button>
						<Button className="w-full" variant="outline">Export CSV</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-heading-3">
							<Moon className="h-5 w-5 text-primary" />
							Appearance
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between rounded-xl border p-3">
							<div className="flex items-center gap-3">
								{state.darkMode ? (
									<Moon className="h-5 w-5" />
								) : (
									<Sun className="h-5 w-5" />
								)}
								<div>
									<p className="text-body-md font-medium">Dark mode</p>
									<p className="text-body-sm text-muted-foreground">Improve visibility in low light</p>
								</div>
							</div>
							<Switch
								checked={state.darkMode}
								onCheckedChange={() => dispatch({ type: "TOGGLE_DARK_MODE" })}
							/>
						</div>
						<div className="flex items-center justify-between rounded-xl border p-3">
							<div className="flex items-center gap-3">
								<Accessibility className="h-5 w-5" />
								<div>
									<p className="text-body-md font-medium">High contrast</p>
									<p className="text-body-sm text-muted-foreground">Stronger contrast for text</p>
								</div>
							</div>
							<Switch
								checked={state.highContrast}
								onCheckedChange={() => dispatch({ type: "TOGGLE_HIGH_CONTRAST" })}
							/>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-heading-3">
							<AlertTriangle className="h-5 w-5 text-primary" />
							Report an issue
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<Textarea
							value={issueText}
							onChange={(e) => setIssueText(e.target.value)}
							placeholder="Describe the problem you faced"
							className="min-h-[120px]"
						/>
						<Button onClick={handleSubmitIssue} className="w-full">Submit issue</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-heading-3">
							<MessageSquare className="h-5 w-5 text-primary" />
							Feedback
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<Textarea
							value={feedbackText}
							onChange={(e) => setFeedbackText(e.target.value)}
							placeholder="Tell us what you want to see next"
							className="min-h-[120px]"
						/>
						<Button onClick={handleSubmitFeedback} className="w-full">Send feedback</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-heading-3">
							<Shield className="h-5 w-5 text-primary" />
							Support
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<Button variant="outline" className="w-full">Help center</Button>
						<Button variant="outline" className="w-full">Safety guidelines</Button>
					</CardContent>
				</Card>
			</main>
		</div>
	);
};

export default Settings;
