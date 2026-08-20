# Hosting Your Website on GitHub Pages

Since you want a professional site without extra hosting costs, **GitHub Pages** is the best choice. It's free, reliable, and supports custom domains like `logicagent.co`.

## Step 1: Upload to GitHub
1. Create a new public repository on GitHub named `logicagent-website`.
2. Upload all the files from this folder (`index.html`, `index.css`, `index.js`, and the `assets/` folder) to that repository.

## Step 2: Enable GitHub Pages
1. In your GitHub repository, go to **Settings** > **Pages**.
2. Under **Build and deployment** > **Source**, select **Deploy from a branch**.
3. Select the `main` branch and `/root` folder, then click **Save**.

## Step 3: Configure Your Custom Domain (`logicagent.co`)
1. In the same **Pages** settings, scroll down to **Custom domain**.
2. Enter `logicagent.co` and click **Save**.
3. GitHub will tell you to update your DNS settings.

## Step 4: Update Your DNS Provider (Where you bought the domain)
Go to your domain registrar (e.g., GoDaddy, Namecheap) and add the following records:

### A Records (Point to GitHub's IPs)
Create four **A** records pointing to these IP addresses:
- `185.199.108.153`
- `185.199.109.153`
- `185.199.110.153`
- `185.199.111.153`

### CNAME Record (For `www`)
Create a **CNAME** record:
- **Host**: `www`
- **Target**: `[your-username].github.io` (Replace `[your-username]` with your GitHub username)

## Step 5: Verify HTTPS
Once DNS propagates (can take up to 24 hours), go back to GitHub Pages settings and check **Enforce HTTPS**.

---
**Your site will then be live at https://logicagent.co!**

---

## Consult form: where enquiries go

The **Book a consult** buttons open a modal form that submits over AJAX and emails the
enquiry to you. Delivery is configured by two constants at the top of `index.js`:

```js
const CONTACT_EMAIL = 'contactus@logicagent.co';
const FORM_ENDPOINT = 'https://formsubmit.co/ajax/' + CONTACT_EMAIL;
```

### One-time activation (required)

GitHub Pages serves static files only, so the actual sending is done by FormSubmit.
It needs no account, but the destination address must be confirmed once:

1. Submit the form yourself after deploying.
2. FormSubmit emails an activation link to `contactus@logicagent.co`.
3. Click it. Every submission after that is delivered straight to the inbox.

Until that link is clicked, submissions are held rather than delivered.

### What gets sent

`name`, `email`, `company`, `topic`, `message`, plus a subject line built from the
sender's name and company. The visitor's address becomes the reply-to, so replying to the
notification answers them directly. Enquiry details pass through **formsubmit.co** — if you
would rather not route them via a third party, swap `FORM_ENDPOINT` for another provider:

- `https://formspree.io/f/<your-form-id>` — free tier, dashboard, spam filtering.
- `https://api.web3forms.com/submit` — needs an `access_key` field in the payload.
- Any endpoint of your own that accepts a JSON POST and returns 2xx.

### Spam handling

A hidden honeypot field (`_honey`) is checked both client-side and by FormSubmit; bots that
fill it get a silent no-op. If the request fails, the form tells the visitor to email
`contactus@logicagent.co` directly rather than failing silently.
