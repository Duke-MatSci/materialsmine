# SDD (Semantic Data Dictionary) Publishing Pipeline

## What Was Built

A new end-to-end pipeline that allows users to upload datasets annotated with Semantic Data Dictionaries, automatically transforming them into standardized nanopublications stored in the knowledge graph.

### 1. New API Endpoint: `/api/curate/publishsdd`
- Accepts dataset metadata (title, description, DOI, organizations, contact point) along with uploaded files (CSV data + XLSX data dictionary)
- Processes the submission through the same validation pipeline as existing XML curations
- Returns a structured response with dataset identifier, label, thumbnail, DOI, organizations, and distribution file links

### 2. Automated Data Transformation (SDD Serializer)
- Reads the uploaded XLSX data dictionary ("Dictionary Mapping" sheet) and CSV data files directly from MinIO storage
- Maps each CSV row against the dictionary definitions to produce semantic triples (attributes, units, roles, relationships, provenance)
- Supports all SDD specification fields: attributes, entities, units, roles, relations, time points, derivation, and generation provenance
- Handles multiple CSV files per submission sharing a single data dictionary

### 3. Nanopublication Generation
- Produces standards-compliant nanopublications with four named graphs: head, assertion, provenance, and publication info
- Enriches metadata via OpenAlex API when a DOI is provided (authors, keywords, related works)
- Falls back to user-provided contact point details when no DOI is available
- Includes organization affiliations, paper title, and description in publication info

### 4. Dataset Detail Page — Revision History Tab
- Added a "History" tab to the dataset detail page showing a table of all changes made to the dataset
- Each history entry displays the contributor's full name (resolved from user records), timestamp, and change summary

### 5. Dataset Gallery Integration
- After successful submission, the new dataset appears in the dataset gallery with its metadata, thumbnail, and downloadable distribution files
- Organization names and file distributions render correctly on the dataset detail page

### 6. Changelog Tracking
- Every SDD publication is recorded in the changelog system, tracking who published, when, and how many triples were added
- Changelog entries use the dataset UUID as the resource identifier, consistent with existing XML curation tracking
