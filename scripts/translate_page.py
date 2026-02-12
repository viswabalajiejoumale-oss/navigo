import argparse
import json
import os
import sys
import urllib.parse
import urllib.request

TRANSLATE_ENDPOINT = "https://translation.googleapis.com/language/translate/v2"


def translate_batch(texts, target_language, api_key):
    if not api_key:
        raise RuntimeError("GOOGLE_TRANSLATE_API_KEY is required")

    data = []
    for t in texts:
        data.append(("q", t))
    data.append(("target", target_language))
    data.append(("format", "text"))

    payload = urllib.parse.urlencode(data).encode("utf-8")
    url = f"{TRANSLATE_ENDPOINT}?key={api_key}"
    req = urllib.request.Request(url, data=payload, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")

    with urllib.request.urlopen(req, timeout=20) as resp:
        body = resp.read().decode("utf-8")
        parsed = json.loads(body)
        translations = parsed.get("data", {}).get("translations", [])
        return [t.get("translatedText", "") for t in translations]


def main():
    parser = argparse.ArgumentParser(description="Translate i18n JSON using Google Translate API.")
    parser.add_argument("--lang", required=True, help="Target language code (e.g., hi, ta, fr)")
    parser.add_argument(
        "--input",
        default=os.path.join("public", "i18n", "en.json"),
        help="Input JSON file with English strings",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Output JSON file path. Defaults to public/i18n/<lang>.json",
    )
    args = parser.parse_args()

    input_path = args.input
    output_path = args.output or os.path.join("public", "i18n", f"{args.lang}.json")

    if not os.path.isfile(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")

    with open(input_path, "r", encoding="utf-8") as f:
        source = json.load(f)

    keys = list(source.keys())
    values = [source[k] for k in keys]

    api_key = os.environ.get("GOOGLE_TRANSLATE_API_KEY")
    translated_map = {}

    batch_size = 50
    for i in range(0, len(values), batch_size):
        chunk = values[i : i + batch_size]
        translated = translate_batch(chunk, args.lang, api_key)
        for idx, text in enumerate(translated):
            key = keys[i + idx]
            translated_map[key] = text or source[key]

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(translated_map, f, ensure_ascii=False, indent=2)

    print(f"Wrote translations to {output_path}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)
