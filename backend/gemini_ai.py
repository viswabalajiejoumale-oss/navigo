import os
import requests
from typing import Dict, List, Optional

def generate_system_prompt(
    language: str,
    user_profile: Optional[Dict] = None,
    transport_mode: Optional[str] = None,
    expenses: Optional[List[Dict]] = None,
    app_context: Optional[Dict] = None
) -> str:
    """Generate a dynamic system prompt based on app context."""
    
    if not user_profile:
        user_profile = {}
    if not expenses:
        expenses = []
    if not app_context:
        app_context = {}
    
    # Core system prompt
    system_prompt = """You are 'Navigo Assistant', an empathetic, intelligent, and accessible travel guide embedded in the 'Navigo' transport application.

**YOUR AUDIENCE:**
Your users are often first-time travelers, elderly people, or people with disabilities who may not be able to read well. They might be anxious or confused.

**YOUR CORE RULES:**
1. **Tone:** Be extremely patient, polite, and reassuring. Speak in simple, short sentences suitable for Text-to-Speech (TTS).
2. **Language:** Automatically detect the language of the user's input. You MUST support these 17 languages: English, Hindi, Tamil, Telugu, Malayalam, Kannada, Bengali, Marathi, Gujarati, Punjabi, Odia, Assamese, Urdu, Sanskrit, Kashmiri, Konkani, Maithili. Always reply in the SAME language the user speaks.
3. **No Jargon:** Never use technical terms. Instead of "Authentication required," say "Please log in."
4. **Brevity:** Keep answers under 40 words unless explaining a complex procedure.

**YOUR KNOWLEDGE BASE:**
- **Bus:** You know about Platform numbers, Bus numbers, and Live Tracking.
- **Train:** You know about PNR status, Coach position, and Station facilities.
- **Airport:** You know about Check-in counters, Security gates, and Boarding passes.
- **Procedures:** You can explain "How to buy a ticket" or "How to pass security" step-by-step.

**FEATURE GUIDANCE:**
- When asked about distance, time, or expenses, provide a clear estimate and say what inputs you need if missing.
- Proactively mention available travel modes (bus, railway, metro, taxi, airport) and suggest the best option for the user.
- Highlight helpful app features when relevant: live map, route planner, expense tracker, accessibility support, and emergency help.

**AUTOMATION & ACTIONS (CRITICAL):**
If the user's intent is to perform an action inside the app, you must append a specific **ACTION TAG** at the end of your response in square brackets like this: `[ACTION:NAME]`.

**List of Action Tags:**
- `[ACTION:NAVIGATE_BUS]` -> If user asks to see buses.
- `[ACTION:NAVIGATE_TRAIN]` -> If user asks to see trains.
- `[ACTION:NAVIGATE_AIRPORT]` -> If user asks to see flights.
- `[ACTION:OPEN_MAP]` -> If user asks "Where am I?" or "Track my bus".
- `[ACTION:PLAY_TUTORIAL]` -> If user asks "How do I do this?" or "Show me a video".
- `[ACTION:EMERGENCY]` -> If user says "Help", "SOS", or seems in danger.
- `[ACTION:READ_SCREEN]` -> If user asks "Read this to me".

**EXAMPLE CONVERSATIONS:**

**User (English):** "I am lost, where is the bus to Chennai?"
**You:** "Don't worry. I am opening the live map for the Chennai bus now. Please look at the screen. [ACTION:NAVIGATE_BUS]"

**User (Tamil):** "Bus eppo varum?"
**You:** "Chennai bus 10 nimidathil varum. Platform 5-il nillungal. [ACTION:OPEN_MAP]"

**User (Hindi):** "Ticket kaise lete hain?"
**You:** "Main aapko ticket lene ka video dikhata hoon. Kripya dhyan se dekhein. [ACTION:PLAY_TUTORIAL]"

**User (English):** "I feel unsafe here."
**You:** "I am activating Emergency Mode immediately. Staying with you. [ACTION:EMERGENCY]"

**CONTEXT INJECTION:**
When you answer, assume you have access to the user's current location and schedule. If the system provides data like `{ bus_delay: '10 mins' }`, incorporate that into your answer naturally.
"""
    
    # Add current user context
    context = system_prompt + "\n\n**CURRENT USER CONTEXT:**\n"
    
    if language:
        context += f"- Preferred Language: {language}\n"
    
    if user_profile.get('name'):
        context += f"- User Name: {user_profile.get('name')}\n"
    
    if transport_mode:
        context += f"- Current Transport Mode: {transport_mode}\n"
    
    if expenses:
        total = sum(float(e.get('amount', 0)) for e in expenses)
        context += f"- Total Travel Expenses: ₹{total:.2f}\n"
        context += f"- Number of Trips Logged: {len(expenses)}\n"
    
    if app_context.get('darkMode'):
        context += "- Accessibility: Dark Mode enabled\n"
    
    if app_context.get('highContrast'):
        context += "- Accessibility: High Contrast mode enabled\n"
    
    context += "\n**REMEMBER:** Respond in the user's language. Be brief, kind, and include ACTION tags when appropriate.\n"
    
    return context


def call_gemini_api(prompt: str, system_prompt: str, max_tokens: int = 500) -> str:
    """Call Google Gemini API with system prompt using REST API."""
    
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set in environment")
    
    try:
        # Combine system prompt and user prompt
        full_prompt = f"{system_prompt}\n\nUser: {prompt}\n\nAssistant:"
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}"
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": full_prompt
                }]
            }],
            "generationConfig": {
                "maxOutputTokens": max_tokens,
                "temperature": 0.7
            }
        }
        
        response = requests.post(url, json=payload, timeout=10)
        
        # If API returns 404, it means API is not enabled or key is invalid
        if response.status_code == 404:
            return generate_fallback_response(prompt, system_prompt)
        
        response.raise_for_status()
        
        result = response.json()
        
        if 'candidates' in result and len(result['candidates']) > 0:
            return result['candidates'][0]['content']['parts'][0]['text']
        else:
            return generate_fallback_response(prompt, system_prompt)
            
    except Exception as e:
        print(f"Gemini API Error: {str(e)}")
        # Fallback to basic response
        return generate_fallback_response(prompt, system_prompt)


def generate_fallback_response(prompt: str, system_prompt: str) -> str:
    """Generate a basic response when Gemini API is not available."""
    prompt_lower = prompt.lower()
    
    # Emergency situations (highest priority)
    if any(word in prompt_lower for word in ['help', 'emergency', 'urgent', 'danger', 'sos', 'accident', 'unsafe', 'scared']):
        return "I am activating Emergency Mode immediately. Staying with you. Please stay calm. [ACTION:EMERGENCY]"
    
    # Lost or location queries
    if any(word in prompt_lower for word in ['lost', 'where am i', 'find me', 'location', 'track']):
        return "Don't worry. I am opening the live map now. Please look at the screen. [ACTION:OPEN_MAP]"
    
    # Tutorial/help with app
    if any(word in prompt_lower for word in ['how to', 'how do i', 'show me', 'tutorial', 'teach', 'learn']):
        return "I will show you a video guide. Please watch carefully. [ACTION:PLAY_TUTORIAL]"
    
    # Bus queries
    if any(word in prompt_lower for word in ['bus', 'route', 'bus number', 'platform']):
        return "Let me show you the bus information now. Opening bus tracker. [ACTION:NAVIGATE_BUS]"
    
    # Train queries
    if any(word in prompt_lower for word in ['train', 'railway', 'pnr', 'coach', 'station']):
        return "I will show you train details now. Please wait. [ACTION:NAVIGATE_TRAIN]"
    
    # Airport/Flight queries
    if any(word in prompt_lower for word in ['flight', 'airport', 'plane', 'boarding', 'check-in']):
        return "Opening airport information for you now. [ACTION:NAVIGATE_AIRPORT]"
    
    # Screen reading accessibility
    if any(word in prompt_lower for word in ['read', 'read this', 'read screen', 'speak']):
        return "I will read the screen to you now. Please listen. [ACTION:READ_SCREEN]"
    
    # Expense/cost queries
    if any(word in prompt_lower for word in ['expense', 'cost', 'fare', 'money', 'spend', 'price', 'ticket price']):
        return "I can help you track travel costs. Let me show you your expense history."
    
    # Route planning
    if any(word in prompt_lower for word in ['route', 'direction', 'navigate', 'way', 'reach', 'go to', 'from', 'to']):
        return "I can help you plan your route. Please tell me where you want to go. [ACTION:OPEN_MAP]"
    
    # Greeting
    if any(word in prompt_lower for word in ['hello', 'hi', 'hey', 'good morning', 'good evening', 'namaste']):
        return "Hello! I am Navigo Assistant. I am here to help you travel safely and easily. What do you need?"
    
    # Default - gentle and reassuring
    return "I am here to help you. Please ask me about buses, trains, flights, or tickets. I will guide you."
