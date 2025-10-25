#!/usr/bin/env python3
"""
Script to merge media objects from Production Data CSV into projects.json
"""

import json
import csv
import re

# Read the CSV file
csv_path = '/Users/adamfehse/Documents/gitrepos/mapappv10/data/Production Data - ProdData 2_26.csv'
json_path = '/Users/adamfehse/Documents/gitrepos/mapappv10/data/projects.json'

# Parse CSV and extract media data
media_by_project = {}

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if not row.get('Project') or not row.get('Media Objects'):
            continue

        project_name = row['Project'].strip()
        media_objects_str = row['Media Objects'].strip()

        # Parse the JSON array from the media objects column
        try:
            # The media objects are JSON arrays but may need cleanup
            media_objects = json.loads(media_objects_str)
            media_by_project[project_name] = media_objects
            print(f"✓ Parsed media for: {project_name}")
            print(f"  Found {len(media_objects)} items")
        except json.JSONDecodeError as e:
            print(f"✗ Error parsing media for {project_name}: {e}")

print(f"\nTotal projects with media data: {len(media_by_project)}")

# Read the projects.json file
with open(json_path, 'r', encoding='utf-8') as f:
    projects = json.load(f)

# Match and merge media data
matched = 0
for project in projects:
    project_name = project.get('ProjectName', '')

    if project_name in media_by_project:
        media_objects = media_by_project[project_name]
        matched += 1

        # Separate media objects into categories
        artworks = []
        music = []
        poems = []
        outcomes = []

        for obj in media_objects:
            outcome_type = obj.get('outcomeType', '')
            media_type = obj.get('mediaType', '').lower()

            if outcome_type:
                # This is an outcome entry
                outcomes.append(obj)
            elif media_type == 'painting' or media_type == 'photography' or media_type == 'art installation' or media_type == 'art and poems':
                # Visual artwork
                artwork_entry = {
                    'title': obj.get('mediaTitle', ''),
                    'description': obj.get('mediaSummary', ''),
                    'imageUrl': obj.get('mediaUrl', '')
                }
                artworks.append(artwork_entry)
            elif media_type == 'poem':
                # Poem entry
                poem_entry = {
                    'title': obj.get('mediaTitle', ''),
                    'text': obj.get('poemSpanish', obj.get('mediaSummary', '')),
                    'author': '',
                    'englishTranslation': obj.get('poem Eng', '')
                }
                # Extract author if available
                if 'author' in obj:
                    poem_entry['author'] = obj['author']
                poems.append(poem_entry)
            elif media_type == 'audio' or media_type == 'music':
                # Music entry
                music_entry = {
                    'title': obj.get('mediaTitle', ''),
                    'description': obj.get('mediaSummary', ''),
                    'mediaUrl': obj.get('mediaUrl', ''),
                    'embeddedContent': obj.get('embededContent', '')
                }
                music.append(music_entry)
            elif media_type == 'video' or media_type == 'podcast' or media_type == 'article':
                # For outcomes, add them there
                outcomes.append(obj)

        # Update project with media
        if artworks:
            project['Artworks'].extend(artworks)
            project['HasArtwork'] = True

        if music:
            project['Music'].extend(music)
            project['HasMusic'] = True

        if poems:
            project['Poems'] = poems  # Replace poems array
            project['HasPoems'] = True

        if outcomes:
            project['Outcomes'].extend(outcomes)

        print(f"✓ Merged data for: {project_name}")
        if artworks:
            print(f"  - Added {len(artworks)} artworks")
        if music:
            print(f"  - Added {len(music)} music items")
        if poems:
            print(f"  - Added {len(poems)} poems")

print(f"\nMatched projects: {matched}/{len(projects)}")

# Write updated projects.json
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(projects, f, ensure_ascii=False, indent=2)

print(f"\n✓ Successfully updated {json_path}")
