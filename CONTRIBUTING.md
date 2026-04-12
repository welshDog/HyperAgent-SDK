# Contributing to HyperAgent-SDK 🤖⚡

Built for ADHD brains — so is this guide. Short. Clear. No fluff.

---

## What You Can Contribute

- **New starter templates** — `templates/python-starter`, `templates/node-starter`, etc.
- **Validator improvements** — better error messages in `cli/validate.js`
- **Spec updates** — new optional fields for `hyper-agent-spec.json`
- **Bug fixes** — if validate gives a wrong result, fix it

---

## The 3-Step Flow

```bash
# 1. Fork + clone
git clone https://github.com/YOUR_NAME/HyperAgent-SDK.git

# 2. Make your change

# 3. Test your change
node cli/validate.js templates/python-starter/
node cli/validate.js templates/node-starter/
```

If both templates validate cleanly → you're good to PR.

---

## Commit Style

We use conventional commits:

```
feat: add deno-starter template
fix: validate.js false positive on empty tools array
docs: clarify mcp_compatible port requirement
chore: bump ajv to 8.x
```

---

## New Template Checklist

Every template in `templates/` must have:

- [ ] `manifest.json` — valid against `hyper-agent-spec.json`
- [ ] `README.md` — what the agent does + how to run it
- [ ] At least one tool with a real `input_schema` (not empty `{}`)
- [ ] Entrypoint file (`main.py` or `index.js`)

---

## Spec Changes

Adding a new field to `hyper-agent-spec.json`?

- Make it **optional** unless there's a compelling reason it's required
- Add a `description` to the field
- Update the README field tables
- Test that existing templates still validate

---

## Questions?

Open an issue. Or ping `@welshDog` on GitHub.

Built with 🧠⚡ in South Wales.
