# ILP based power switch for TP-Link Smart Plugs

Allows you to switch a **tp-link**  `HS-110` Smart Plug based on incoming streaming ILP payments (The `HS-100` doesn't offer Power Monitoring, so if one day someone (or I) updates the code to adjust the payments to the actual power use, you'll need the `HS-110`!)

[![Demo](https://d3kn1gt.dlvr.cloud/ilp.png)](https://www.youtube.com/watch?v=QjtKNiPP7B8 "Click to play on Youtube")

## Howto

Make sure you have a local [**moneyd** instance configured (XRP at livenet)](https://medium.com/interledger-blog/joining-the-live-ilp-network-eab123a73665) running on your local computer.

1. Connect and configure your **tp-link** Smart Plug with your smartphone (using the "Kasa" app). Make sure your plug connects to the same WiFi network as your computer.
2. Make sure you have node installed.
3. Clone this repo on your computer.
4. Discover the device on your network. Run: `npm run discover`
5. Run the ILP-PowerSwitch '_bridge_' with: `npm run go AA:BB:CC:DD...` (use the HWADDR found in step 4).
6. Make sure ILP payments come in at the Payment Pointer displayed by this tool when started (step 5). If you have an active Coil account, you can use (fork) [this piece of code](https://jsfiddle.net/WietseWind/j4byqk1t/2/).


## Advanced

If you want to specify your own subdomain (`yourname.localtunnel.me`), enter your subdomain after your HWADDR when starting (step 5):

```
npm run go AA:BB:CC:DD... pepperparrot
```

If your subdomain is available, your Payment Pointer will be:
**`$pepperparrot.localtunnel.me`**
