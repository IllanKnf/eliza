// packages/plugin-alchemy/src/jobs/price-alerts.ts
export async function startPriceAlertJob(runtime: IAgentRuntime) {
    setInterval(async () => {
        const db = runtime.getDatabaseAdapter();
        await checkPriceAlerts(db);
    }, 15 * 60 * 1000); // Vérifier toutes les 15 minutes
}