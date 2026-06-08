# GRMC-Agent-n8n

n8n workflows and automation for Grace Resurrection (GRMC), built on the
[Breeze ChMS](https://www.breezechms.com/) API.

## Workflows

### `workflows/breeze-form-entries.json`

Pulls submitted entries for a Breeze form, auto-detects the **notes /
free-text** field, and flattens every submission into one tidy row
(`entry_id`, `created_on`, `person_id`, `notes`, plus every answered field
by its human-readable name).

**Flow:** `Manual / Schedule trigger → Config → List Form Fields →
List Form Entries → Flatten Entries`

#### Import & configure

1. In n8n: **Workflows → Import from File** and select
   `workflows/breeze-form-entries.json`.
2. Create an **HTTP Header Auth** credential named **`Breeze Api-Key`**:
   - **Name:** `Api-Key`
   - **Value:** your Breeze API key (Breeze → *Account Settings → Extensions
     → API*).

   Attach it to both HTTP Request nodes (`List Form Fields`,
   `List Form Entries`). On import n8n will prompt for the credential since
   the IDs are placeholders.
3. Open the **Config** node and set:
   - `subdomain` — defaults to `graceresurrection`
     (the `<subdomain>` in `https://<subdomain>.breezechms.com`).
   - `formId` — from the form's URL or the Forms list
     (replace `REPLACE_WITH_FORM_ID`).
4. Click **Test workflow** to run it once, or enable the **Schedule** trigger
   (defaults to every 6 hours).

#### How the notes field is detected

`Flatten Entries` picks the notes field by, in order:

1. a field whose **name** matches `note|comment|message|prayer|question|request|detail`, then
2. the first **free-text** field type (`single_line`, `multiple_lines`,
   `textarea`, `paragraph`).

The chosen field id is surfaced on each row as `notes_field_id` so you can
confirm the auto-detection or hard-code it if needed.

## API reference

The workflow mirrors these Breeze endpoints (handy for ad-hoc debugging):

```bash
SUBDOMAIN="graceresurrection"
FORM_ID="REPLACE_WITH_FORM_ID"        # from the form's URL or the Forms list
API_KEY="$(cat ~/.breeze_key)"        # or paste the key directly

# Which field_id is the notes / free-text box
curl -s "https://${SUBDOMAIN}.breezechms.com/api/forms/list_form_fields?form_id=${FORM_ID}" \
  -H "Api-Key: ${API_KEY}" | python3 -m json.tool

# The actual submitted entries
curl -s "https://${SUBDOMAIN}.breezechms.com/api/forms/list_form_entries?form_id=${FORM_ID}&details=1" \
  -H "Api-Key: ${API_KEY}" | python3 -m json.tool
```
