import urllib.request
import re
import json
import ssl

def main():
    ctx = ssl._create_unverified_context()
    url = 'https://streamingsiteshub.com/'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'})
    
    with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
        html = resp.read().decode('utf-8')

    next_f_chunks = re.findall(r'self\.__next_f\.push\(\[1,\"(.*?)\"\]\)', html)
    payload = ''.join(next_f_chunks)

    # Match card details: name, domain, link
    cards = re.findall(
        r'truncate\\\",\\\"children\\\":\\\"([^\\\"]+)\\\"\}.*?truncate\\\",\\\"children\\\":\\\"([^\\\"]+)\\\"\}.*?href\\\":\\\"(https?://[^\\\"]+)\\\"',
        payload
    )

    sites = []
    seen = set()

    for c in cards:
        name, domain, link = c[0].strip(), c[1].strip(), c[2].strip()
        if domain not in seen and not link.startswith('https://streamingsiteshub.com'):
            seen.add(domain)
            sites.append({
                'rank': len(sites) + 1,
                'name': name,
                'domain': domain,
                'url': link
            })

    print(f"Card pattern extracted {len(sites)} sites.")

    # Fallback to extract unique streaming site URLs from payload
    all_urls = re.findall(r'https?://[a-zA-Z0-9\.\-_]+\.[a-zA-Z]{2,6}/?[^\s\"\'\\]*', payload)
    
    ignored = [
        'streamingsiteshub.com', 'w3.org', 'schema.org', 'googletagmanager.com',
        'ko-fi.com', 'discord.gg', 'vercel.app', 'github.com'
    ]

    for u in all_urls:
        if len(sites) >= 50:
            break
        u_clean = u.rstrip('\\').rstrip('/')
        if any(ig in u_clean for ig in ignored):
            continue
        parts = u_clean.split('/')
        if len(parts) >= 3:
            dom = parts[2].lower().replace('www.', '')
            if dom not in seen:
                seen.add(dom)
                name_guess = dom.split('.')[0].capitalize()
                sites.append({
                    'rank': len(sites) + 1,
                    'name': name_guess,
                    'domain': dom,
                    'url': u_clean
                })

    top50 = sites[:50]
    print(f"\nFinal Top 50 Sites Extracted:")
    for s in top50:
        print(f"{s['rank']}. {s['name']} ({s['domain']}) -> {s['url']}")

    with open('data/streamingsiteshub_top50.json', 'w', encoding='utf-8') as f:
        json.dump(top50, f, ensure_ascii=False, indent=2)

    print(f"\nSuccessfully saved {len(top50)} sites to data/streamingsiteshub_top50.json")

if __name__ == '__main__':
    main()
