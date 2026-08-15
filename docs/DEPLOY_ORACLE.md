# Deploying Pocketsly on Oracle Cloud Always Free (VPS)

A real Linux server with a **permanent disk** — your SQLite data survives restarts,
for $0/month, forever (within Oracle's Always Free limits).

> **Prerequisites:** an Oracle Cloud account. Signup asks for a card to verify
> identity but **never charges** you while you stay inside the free tier.

---

## 1. Create the VM (Always Free config)

1. Oracle Cloud Console → **Compute → Instances → Create instance**
2. Name: `pocketsly`
3. Image: **Ubuntu 24.04** (default) — Python 3 is preinstalled
4. Shape: pick an **Always Free** shape (Ampere A1 ARM is fastest; or `VM.Standard.E1.1GB` x86). Keep the free OCPU/RAM amounts.
5. **SSH keys**: generate one on your machine and paste the public key:

   ```bash
   ssh-keygen -t ed25519 -C "oracle"     # keep the default ~/.ssh/id_ed25519
   cat ~/.ssh/id_ed25519.pub             # paste this into the console
   ```

6. Boot volume: keep the default (free tier includes plenty).
7. **Create** → wait for `Running` → copy the **Public IP address**.

> Optional but smart: **Reserved Public IP** (Networking → Reserved IPs) — attach
> one to the instance so the IP never changes.

## 2. Connect & get the code

```bash
ssh -i ~/.ssh/id_ed25519 ubuntu@<PUBLIC_IP>
```

Get the project onto the VM — **recommended: push to GitHub first, then:**

```bash
sudo apt update && sudo apt install -y git
git clone https://github.com/<you>/pocketsly.git
cd pocketsly
```

*(No GitHub yet? Copy from your machine instead: `rsync -av --exclude .git --exclude .freebuff ./pocketsly ubuntu@<PUBLIC_IP>:~/`)*

## 3. Smoke-test it

```bash
cd pocketsly
python3 server.py
```

It should print the startup banner. The browser can't reach it yet (firewall —
next step), so leave it running and verify the port is listening:

```bash
sudo ss -tlnp | grep 8000
```

## 4. Open the firewall — the #1 gotcha (TWO places)

**a) Oracle's cloud firewall (VCN Security List):**
Console → **Networking → Virtual cloud networks → your VCN → Security Lists → Default → Add Ingress Rule**:
- Source: `0.0.0.0/0`, IP protocol: TCP, Destination port: `8000`

**b) The VM's own firewall** (Ubuntu images ship their own iptables):

```bash
sudo iptables -I INPUT -p tcp --dport 8000 -j ACCEPT
sudo apt install -y netfilter-persistent && sudo netfilter-persistent save
```

Now `http://<PUBLIC_IP>:8000` works from any browser.

## 5. Run it forever (systemd)

Stop the manual server (Ctrl+C), then:

```bash
sudo tee /etc/systemd/system/pocketsly.service > /dev/null <<'EOF'
[Unit]
Description=Pocketsly web app
After=network.target

[Service]
WorkingDirectory=/home/ubuntu/pocketsly
ExecStart=/usr/bin/python3 server.py
Restart=always
Environment=PORT=8000

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now pocketsly
sudo systemctl status pocketsly    # should say "active (running)"
```

It now auto-starts on boot and restarts on crash. Your `daily_app.db` lives on the
VM's disk — persistent.

## 6. HTTPS (free) — recommended before pointing Netlify at it

Easiest path: **Cloudflare** (free plan).

1. Add your domain to Cloudflare and point its nameservers.
2. DNS → add an **A record**: name `pocketsly`, IP = the VM's public IP, proxy **ON** (orange cloud).
3. Cloudflare → **SSL/TLS → Overview → mode: Flexible** (Cloudflare terminates HTTPS; your origin stays plain HTTP on port 8000 — no certificate setup on the VM).

Now `https://pocketsly.yourdomain.com` reaches the app.

> For better security, once HTTPS works you can restrict the VCN ingress rule to
> Cloudflare's IP ranges only, so nobody can hit the VM's port 8000 directly.

## 7. Point Netlify at the backend

In `static/_redirects`, **above** the `/*` rule, uncomment and set the proxy:

```
/api/*  https://pocketsly.yourdomain.com/api/:splat  200
```

Redeploy Netlify. Now the static site proxies `/api/*` to your Oracle backend —
login, sessions, and all data operations work, and SQLite persists on the VM.

---

## Keeping it healthy

```bash
sudo systemctl status pocketsly          # running?
sudo journalctl -u pocketsly -f          # live logs
```

- **Backups**: `daily_app.db` is your data. Copy it off periodically:
  `scp ubuntu@<PUBLIC_IP>:~/pocketsly/daily_app.db ./backup-$(date +%F).db`
- **Updates**: `cd pocketsly && git pull && sudo systemctl restart pocketsly`
- **Free-tier fine print**: always-free capacity (OCPUs/RAM/disk) is limited per
  account — don't scale the instance beyond the free shape.
