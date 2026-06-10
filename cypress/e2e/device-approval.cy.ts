describe("Device approval page", () => {
  it("renders Chinese approval details from URL parameters", () => {
    cy.visit(
      "/device-approval?user=test@example.com&device=test-device&network=test-vpn",
    );

    cy.contains("h1", "设备接入").should("be.visible");
    cy.contains("test-device test@example.com 接入 test-vpn，需要管理员审批。").should(
      "be.visible",
    );
    cy.contains("审批通过后，您可以返回客户端查看接入状态。").should("be.visible");
  });

  it("renders English approval details from URL parameters", () => {
    cy.visit(
      "/device-approval?lang=en-US&user=test@example.com&device=test-device&network=test-vpn",
    );

    cy.contains("h1", "Device access").should("be.visible");
    cy.contains(
      "New device test-device for test@example.com is joining the test-vpn network and needs administrator approval.",
    ).should("be.visible");
    cy.contains("After approval, return to the client to check the connection status.").should(
      "be.visible",
    );
  });

  it("renders fallback values without URL parameters", () => {
    cy.visit("/device-approval");

    cy.contains("h1", "设备接入").should("be.visible");
    cy.contains("新设备 当前账号 接入 中通快运 VPN，需要管理员审批。").should("be.visible");
  });
});
