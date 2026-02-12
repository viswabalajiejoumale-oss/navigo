import sys
import json
import os
from gemini_ai import generate_system_prompt, call_gemini_api

try:
    # Parse input from Node
    data = json.loads(sys.argv[1])
    
    prompt = data.get('prompt', '')
    language = data.get('language', 'en')
    user_profile = data.get('userProfile', {})
    transport_mode = data.get('transportMode', '')
    expenses = data.get('expenses', [])
    app_context = data.get('appContext', {})
    
    # Generate system prompt with context
    system_prompt = generate_system_prompt(
        language=language,
        user_profile=user_profile,
        transport_mode=transport_mode,
        expenses=expenses,
        app_context=app_context
    )
    
    # Call Gemini API
    response = call_gemini_api(prompt, system_prompt)
    
    # Return response
    print(json.dumps({'response': response}))
    
except Exception as e:
    print(json.dumps({'error': str(e)}), file=sys.stderr)
    sys.exit(1)
