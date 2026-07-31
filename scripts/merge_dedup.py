import os
import json
import urllib.parse
import re

def main():
    upload_dir = '/Users/billtin/.gemini/antigravity/brain/fc76e68a-75bd-4d40-9bc3-fb1066882a2d/.user_uploaded'
    files = sorted([f for f in os.listdir(upload_dir) if f.endswith('.json')])
    
    raw_sources = []
    
    for filename in files:
        filepath = os.path.join(upload_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
                sites = data.get('sites', []) if isinstance(data, dict) else data
                print(f"Loaded {len(sites)} entries from {filename}")
                raw_sources.extend(sites)
            except Exception as e:
                print(f"Error loading {filename}: {e}")
                
    print(f"Total raw source count: {len(raw_sources)}")
    
    dedup = {}
    
    for s in raw_sources:
        name = s.get('name', '').strip()
        api = s.get('api', '').strip()
        if not api or not api.startswith('http'):
            continue
            
        parsed = urllib.parse.urlparse(api)
        domain = parsed.netloc.lower()
        path = parsed.path.rstrip('/')
        
        base_path = re.sub(r'/(from|at)/.*$', '', path)
        if not base_path:
            base_path = '/api.php/provide/vod'
            
        norm_key = f"{domain}{base_path}"
        base_url = f"{parsed.scheme}://{parsed.netloc}{base_path}/"
        
        clean_name = re.sub(r'\|点播$', '', name).strip()
        
        if norm_key not in dedup:
            dedup[norm_key] = {
                'id': f"src_{len(dedup) + 1}",
                'name': clean_name,
                'api': base_url,
                'raw_api': api,
                'type': s.get('type', 1),
                'ext': s.get('ext', ''),
                'domain': domain
            }
        else:
            existing = dedup[norm_key]
            if len(clean_name) > len(existing['name']) and '|' not in clean_name:
                existing['name'] = clean_name
                
    merged_list = list(dedup.values())
    print(f"Deduplicated total unique sources: {len(merged_list)}")
    
    out_dir = '/Users/billtin/projects/strand-vod-addon/data'
    os.makedirs(out_dir, exist_ok=True)
    
    with open(os.path.join(out_dir, 'vod_sources.json'), 'w', encoding='utf-8') as f:
        json.dump(merged_list, f, ensure_ascii=False, indent=2)
        
    tvbox_data = {
        "sites": [
            {
                "key": item['id'],
                "name": item['name'],
                "type": item['type'],
                "api": item['api'],
                "searchable": 1,
                "quickSearch": 1,
                "filterable": 1
            }
            for item in merged_list
        ]
    }
    with open(os.path.join(out_dir, 'tvbox_sources.json'), 'w', encoding='utf-8') as f:
        json.dump(tvbox_data, f, ensure_ascii=False, indent=2)
        
    print(f"Saved merged files to {out_dir}")

if __name__ == '__main__':
    main()
