import { test, expect } from '@playwright/test';

test.describe('Cryptographic Audit Trail Flow', () => {
  test('should complete the full compliance lifecycle: enroll -> see proof -> verify -> cancel', async ({ page }) => {
    // 1. Navigate to the audit page
    await page.goto('/audit');

    // Verify the page loaded correctly
    await expect(page.locator('h1')).toHaveText('Cryptographic Audit Trail');

    // 2. Check the initial state (Unverified)
    const statusBadge = page.locator('.id-status-badge');
    await expect(statusBadge).toHaveText('Unverified');

    // Proof container should show the enrollment placeholder
    const proofPlaceholder = page.locator('text=Awaiting compliance enrollment to compute commitment...');
    await expect(proofPlaceholder).toBeVisible();

    // Verify the initial audit steps
    const auditSteps = page.locator('.audit-step');
    await expect(auditSteps).toHaveCount(2);
    await expect(auditSteps.nth(0)).toContainText('Wallet Identity Connected');
    await expect(auditSteps.nth(0)).toHaveClass(/success/);
    await expect(auditSteps.nth(1)).toContainText('Compliance Screening');
    await expect(auditSteps.nth(1)).toHaveClass(/pending/);

    // 3. Click Enroll
    const enrollBtn = page.locator('#enroll-btn');
    await enrollBtn.click();

    // Wait for the loading skeletons to finish
    await expect(page.locator('#cancel-btn')).toBeVisible({ timeout: 5000 });

    // 4. Verify Enrolled State
    await expect(statusBadge).toHaveText('Verified');

    // Proof hex display should be visible and contain a valid hash
    const proofHashDisplay = page.locator('#proof-hash-display');
    await expect(proofHashDisplay).toBeVisible();
    await expect(proofHashDisplay).toContainText(/0x[a-fA-F0-9]{64}/);

    // Audit steps should now show zk-SNARK proof generation step
    await expect(auditSteps).toHaveCount(4);
    await expect(auditSteps.nth(1)).toHaveClass(/success/); // Compliance Screening is now successful
    await expect(auditSteps.nth(2)).toContainText('Generate zk-SNARK Proof');
    await expect(auditSteps.nth(2)).toHaveClass(/success/);
    await expect(auditSteps.nth(3)).toContainText('Verify Soroban Host VM');
    await expect(auditSteps.nth(3)).toHaveClass(/pending/);

    // 5. Verify Proof on Ledger
    const verifyBtn = page.locator('#verify-btn');
    await verifyBtn.click();

    // Wait for ledger verification to complete
    await expect(page.locator('#verified-indicator')).toBeVisible({ timeout: 5000 });

    // Verify ledger consensus is now successful
    await expect(auditSteps).toHaveCount(5);
    await expect(auditSteps.nth(3)).toHaveClass(/success/);
    await expect(auditSteps.nth(4)).toContainText('Ledger Settlement Consensus');
    await expect(auditSteps.nth(4)).toHaveClass(/success/);

    // 6. Cancel Enrollment
    const cancelBtn = page.locator('#cancel-btn');
    await cancelBtn.click();

    // Wait for cancellation to complete
    await expect(page.locator('#enroll-btn')).toBeVisible({ timeout: 5000 });

    // Verify state has reset back to Unverified
    await expect(statusBadge).toHaveText('Unverified');
    await expect(proofPlaceholder).toBeVisible();
    await expect(auditSteps).toHaveCount(2);
    await expect(auditSteps.nth(1)).toHaveClass(/pending/);
  });
});
