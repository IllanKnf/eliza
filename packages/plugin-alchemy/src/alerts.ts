// packages/plugin-alchemy/src/alerts.ts

export async function checkPriceAlerts(db: IDatabaseAdapter) {
    const alerts = await db.query(`
      SELECT * FROM price_alerts 
      WHERE is_active = true 
      AND (
        last_checked_at IS NULL 
        OR datetime(last_checked_at, '+15 minutes') <= datetime('now')
      )
    `);
  
    for (const alert of alerts) {
      const currentPrice = await getCurrentTokenPrice(alert.token_address);
      const priceChange = ((currentPrice - alert.last_checked_price_usd) / alert.last_checked_price_usd) * 100;
  
      if (Math.abs(priceChange) >= alert.threshold_percentage) {
        await triggerPriceAlert(alert, priceChange, currentPrice);
      }
  
      await db.execute(`
        UPDATE price_alerts 
        SET last_checked_price_usd = ?, 
            last_checked_at = datetime('now')
        WHERE id = ?
      `, [currentPrice, alert.id]);
    }
  }