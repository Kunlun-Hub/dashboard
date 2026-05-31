describe("Click all tabs in peer modal", () => {
  it("passes", () => {
    cy.intercept("GET", "**/api/instance/branding", {
      statusCode: 200,
      body: {},
    });
    cy.intercept("GET", "**/api/version-releases/public", {
      statusCode: 200,
      body: [
        {
          id: "linux-amd64",
          version: "1.2.3",
          platform: "linux",
          architecture: "amd64",
          downloadUrl: "https://downloads.example.com/cloink-linux.tar.gz",
          isLatest: true,
          createdAt: "2026-05-31T00:00:00Z",
        },
        {
          id: "windows-amd64",
          version: "1.2.3",
          platform: "windows",
          architecture: "amd64",
          downloadUrl: "https://downloads.example.com/cloink-windows.exe",
          isLatest: true,
          createdAt: "2026-05-31T00:00:00Z",
        },
        {
          id: "macos-universal",
          version: "1.2.3",
          platform: "macos",
          architecture: "universal",
          downloadUrl: "https://downloads.example.com/cloink-macos.dmg",
          isLatest: true,
          createdAt: "2026-05-31T00:00:00Z",
        },
        {
          id: "android-universal",
          version: "1.2.3",
          platform: "android",
          architecture: "universal",
          downloadUrl: "https://downloads.example.com/cloink-android.apk",
          isLatest: true,
          createdAt: "2026-05-31T00:00:00Z",
        },
      ],
    }).as("publicVersions");

    cy.visit("/install");
    cy.wait("@publicVersions");
    cy.contains("1.2.3").should("be.visible");
    cy.contains('[role="tab"]', "Linux").click();
    cy.get("[data-cy=copy-to-clipboard]:visible").first().click();
    cy.contains('[role="tab"]', "Windows").click();
    cy.get("[data-cy=copy-to-clipboard]:visible").first().click();
    cy.contains('[role="tab"]', "Android").click();
    cy.get("[data-cy=copy-to-clipboard]:visible").first().click();
    cy.contains('[role="tab"]', "Docker").click();
    cy.get("[data-cy=copy-to-clipboard]:visible").first().click();
  });
});
