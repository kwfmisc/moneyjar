# Money Jar

## Google Sheets setup

The app works locally with browser storage. To share the same contribution data across devices, connect a Google Sheet:

1. Create a Google Sheet and open **Extensions > Apps Script**.
2. Copy the contents of `google-apps-script/Code.gs` into the Apps Script editor and save it.
3. Choose **Deploy > New deployment**, select **Web app**, set **Execute as** to yourself, and set **Who has access** to **Anyone**.
4. Copy the web app URL ending in `/exec`.
5. In the GitHub repository, open **Settings > Secrets and variables > Actions > Variables** and add `VITE_SHEETS_WEB_APP_URL` with that URL.
6. Run the Pages workflow again from the repository's **Actions** tab.

The sheet will create a `Contributions` tab automatically. It stores the amount, date, contributor, and timestamp. Keep the web app URL private to the project because anyone with access to the public site can add or remove rows.