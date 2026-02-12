const TRANSLATE_ENDPOINT = "https://translation.googleapis.com/language/translate/v2";

export async function translateTextBatch(texts: string[], target: string, apiKey: string) {
  if (!apiKey) {
    console.warn("No Google API key provided. Skipping translation.");
    return texts;
  }
  
  const body = new URLSearchParams();
  texts.forEach((t) => body.append("q", t));
  body.append("target", target);
  body.append("format", "text");

  try {
    const res = await fetch(`${TRANSLATE_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      // If API key is blocked (403) or restricted, return original texts as graceful fallback
      if (res.status === 403) {
        console.warn("Translation API blocked (403). The API key may not have Translation API enabled or has IP/referrer restrictions. Returning original texts. Enable 'Cloud Translation API' in Google Cloud Console if you want translations.");
        return texts;
      }
      if (res.status === 400 || res.status === 401) {
        console.warn(`Translation API authentication error (${res.status}). Check your API key. Returning original texts.`);
        return texts;
      }
      throw new Error(`Translation API error: ${res.status}`);
    }

    const json = await res.json();
    return json.data.translations.map((t: any) => t.translatedText as string);
  } catch (err) {
    console.warn("translateTextBatch skipped:", (err as any)?.message || err);
    // On network errors or other failures, return original texts so UI remains usable
    return texts;
  }
}

// Translate visible text nodes for a simple page-level translation.
export async function translatePage(target: string, apiKey: string) {
  if (!apiKey) {
    console.warn("No Google API key provided for page translation. Skipping.");
    return;
  }
  const selectors = "h1,h2,h3,h4,h5,p,span,button,label,li,a,option,small,strong";
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(selectors)).filter(
    (el) => el.innerText && el.offsetParent !== null
  );
  const texts = nodes
    .map((n) => {
      const original = n.dataset.__originalText || n.innerText.trim();
      if (!n.dataset.__originalText && original) n.dataset.__originalText = original;
      return original;
    })
    .filter(Boolean);
  if (texts.length === 0) return;

  const chunkSize = 50;
  for (let i = 0; i < texts.length; i += chunkSize) {
    const chunk = texts.slice(i, i + chunkSize);
    try {
      const translated = await translateTextBatch(chunk, target, apiKey);
      translated.forEach((t, idx) => {
        const node = nodes[i + idx];
        if (node) {
          node.innerText = t;
          node.dataset.__translated = target;
        }
      });
    } catch (e) {
      console.error("translatePage error:", e);
    }
  }
}

export async function translatePageViaBackend(target: string, baseUrl?: string) {
  const selectors = "h1,h2,h3,h4,h5,p,span,button,label,li,a,option,small,strong";
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(selectors)).filter(
    (el) => el.innerText && el.offsetParent !== null
  );
  const texts = nodes
    .map((n) => {
      const original = n.dataset.__originalText || n.innerText.trim();
      if (!n.dataset.__originalText && original) n.dataset.__originalText = original;
      return original;
    })
    .filter(Boolean);
  if (texts.length === 0) return;

  const chunkSize = 50;
  const base =
    baseUrl ||
    (import.meta.env.VITE_API_URL as string | undefined) ||
    "http://localhost:4000";

  for (let i = 0; i < texts.length; i += chunkSize) {
    const chunk = texts.slice(i, i + chunkSize);
    try {
      const res = await fetch(`${base}/translate/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: chunk, targetLanguage: target }),
      });
      if (!res.ok) throw new Error(`Translate batch failed: ${res.status}`);
      const json = await res.json();
      const translated = json.translations || [];
      translated.forEach((t: string, idx: number) => {
        const node = nodes[i + idx];
        if (node) {
          node.innerText = t || chunk[idx];
          node.dataset.__translated = target;
        }
      });
    } catch (e) {
      console.error("translatePageViaBackend error:", e);
    }
  }
}

// Translate all text nodes using a prebuilt map (keyed by English source text).
// This walks the entire DOM tree including all text nodes, not just specific selectors.
export function translatePageWithMap(translations: Record<string, string>, language: string) {
  if (!translations || Object.keys(translations).length === 0) return;

  // Walk through all nodes in the DOM tree
  const walkDOM = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      
      // Skip script and style tags
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') {
        return;
      }

      // First, check if this element has direct text content (before walking children)
      if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
        const textNode = el.childNodes[0] as Text;
        const original = textNode.data.trim();
        
        if (original && translations[original]) {
          textNode.data = translations[original];
          return; // Don't recurse into children since we translated the whole element
        }
      }
      
      // Otherwise, walk all child nodes
      for (let i = 0; i < el.childNodes.length; i++) {
        walkDOM(el.childNodes[i]);
      }
    } 
    else if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node as Text;
      const original = textNode.data.trim();
      
      if (original && translations[original]) {
        // Replace the text node's content with the translated version
        textNode.data = translations[original];
      }
    }
  };

  // Handle all special attributes and form controls
  const allElements = document.querySelectorAll('*');
  allElements.forEach((el: Element) => {
    const elem = el as HTMLElement;

    // Translate input placeholders
    if (elem instanceof HTMLInputElement && elem.placeholder) {
      const original = elem.placeholder.trim();
      if (original && translations[original]) {
        elem.placeholder = translations[original];
      }
    }

    // Translate textarea placeholders
    if (elem instanceof HTMLTextAreaElement && elem.placeholder) {
      const original = elem.placeholder.trim();
      if (original && translations[original]) {
        elem.placeholder = translations[original];
      }
    }

    // Translate input values (for buttons)
    if (elem instanceof HTMLInputElement && (elem.type === 'button' || elem.type === 'submit' || elem.type === 'reset')) {
      const original = elem.value.trim();
      if (original && translations[original]) {
        elem.value = translations[original];
      }
    }

    // Translate button text through innerText
    if (elem instanceof HTMLButtonElement) {
      const original = elem.innerText?.trim();
      if (original && translations[original]) {
        elem.innerText = translations[original];
      }
    }

    // Translate option elements in select dropdowns
    if (elem instanceof HTMLOptionElement) {
      const original = elem.innerText?.trim();
      if (original && translations[original]) {
        elem.innerText = translations[original];
      }
    }

    // Translate aria-labels for accessibility
    if (elem.hasAttribute('aria-label')) {
      const original = elem.getAttribute('aria-label')?.trim();
      if (original && translations[original]) {
        elem.setAttribute('aria-label', translations[original]);
      }
    }

    // Translate title attributes
    if (elem.hasAttribute('title')) {
      const original = elem.getAttribute('title')?.trim();
      if (original && translations[original]) {
        elem.setAttribute('title', translations[original]);
      }
    }

    // Translate aria-placeholder (some components use this)
    if (elem.hasAttribute('aria-placeholder')) {
      const original = elem.getAttribute('aria-placeholder')?.trim();
      if (original && translations[original]) {
        elem.setAttribute('aria-placeholder', translations[original]);
      }
    }
  });

  // Start the DOM walk from body to translate all text nodes
  walkDOM(document.body);
}
