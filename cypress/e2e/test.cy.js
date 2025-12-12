describe('template spec', () => {
  it('passes', () => {
    cy.visit('https://example.cypress.io')
  })
});

it('test', function() {
  cy.visit('http://localhost:5173/')
  cy.get('#root a.text-gray-600').click();
  cy.get('[name="name"]').click();
  cy.get('[name="name"]').type('Debo');
  cy.get('[name="email"]').click();
  cy.get('[name="email"]').type('debo@tixflow.nl');
  cy.get('[name="organization"]').click();
  cy.get('[name="organization"]').type('TixFlow');
  cy.get('[name="password"]').click();
  cy.get('[name="password"]').type('Test123#');
  cy.get('[name="confirm"]').click();
  cy.get('[name="confirm"]').type('Test123#');
  cy.get('#root button.w-full').click();
  cy.get('#root form.space-y-4 div:nth-child(1)').click();
  cy.get('#email').click();
  cy.get('#email').type('debo@tixflow.nl');
  cy.get('#password').clear();
  cy.get('#password').type('Test123#{enter}');
  cy.get('#root button.w-full').click();
  cy.get('#root button.text-white').click();
  cy.get('[name="title"]').click();
  cy.get('[name="title"]').type('Douwe Egbert');
  cy.get('[name="date"]').click();
  cy.get('[name="date"]').click();
  cy.get('[name="date"]').click();
  cy.get('[name="time"]').type('20:00');
  cy.get('[name="date"]').click();
  cy.get('[name="location"]').click();
  cy.get('[name="location"]').type('Amsterdam');
  cy.get('[name="description"]').click();
  cy.get('[name="description"]').type('Test');
  cy.get('#root input[placeholder="Bijv. Standaard"]').click();
  cy.get('#root input[placeholder="Bijv. Standaard"]').type('Zitplek');
  cy.get('#root input[step="0.01"]').click();
  cy.get('#root input[step="0.01"]').type('10');
  cy.get('#root input[step="1"]').click();
  cy.get('#root input[step="1"]').type('100');
  cy.get('#root button.text-white').click();
  cy.get('#root button.bg-gray-100').click();
  cy.get('#root a.font-medium').click();
  cy.get('#root div.sm\\:justify-between button.bg-blue-600').click();
  
});

it('test 2', function() {
  cy.visit('http://localhost:5173/event/douwe-egbert')
  cy.get('#root button.text-gray-700').click();
  cy.get('#root button.w-full').click();
  cy.get('#firstName').click();
  cy.get('html').click();
  cy.get('#firstName').type('test');
  cy.get('#firstName').clear();
  cy.get('#firstName').type('Test');
  cy.get('#lastName').click();
  cy.get('#lastName').type('Test');
  cy.get('#root form.p-6').click();
  cy.get('#email').click();
  cy.get('#email').type('Testertixflow@gmail.com');
  it('start checkout en redirect naar Stripe', () => {
    cy.intercept('POST', '/api/checkout*').as('createCheckout')
    cy.visit('http://localhost:5173/event/douwe-egbert')
    cy.get('[data-cy=buy-ticket]').click()
  
    cy.wait('@createCheckout').its('response.statusCode').should('eq', 200)
    cy.location('host').should('eq', 'checkout.stripe.com')
  })
  cy.get('#root button.text-white').click();
});