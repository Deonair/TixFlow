describe('template spec', () => {
  it('passes', () => {
    cy.visit('https://example.cypress.io')
  })
});

it('CreateLogin', function() {
  cy.visit('http://localhost:5173')
  
  cy.get('#root a[href="/register"]').click();
  cy.get('[name="name"]').click();
  cy.get('[name="name"]').type('Chris Flowian');
  cy.get('[name="email"]').click();
  cy.get('[name="email"]').type('chris@tixflow.nl');
  cy.get('[name="organization"]').type('Windesheim');
  cy.get('[name="password"]').click();
  cy.get('[name="password"]').type('test123#');
  cy.get('[name="confirm"]').click();
  cy.get('[name="confirm"]').type('test123#');
  cy.get('#root button.w-full').click();
  cy.get('#email').click();
  cy.get('#email').type('chris@tixflow.nl');
  cy.get('#password').type('test123#');
  cy.get('#root button.w-full').click();
  
});

it('Event Aanmaken', function() {
  cy.visit('http://localhost:5173')
  
  cy.get('#root a[href="/login"]').click();
  cy.get('#email').click();
  cy.get('#email').type('chris@tixflow.nl');
  cy.get('#password').click();
  cy.get('#password').type('test123#');
  cy.get('#root button.w-full').click();
  
  cy.get('#root button.text-white').click();
  cy.get('[name="title"]').click();
  cy.get('[name="title"]').type('Windesheim Winterball');
  cy.get('[name="date"]').click();
  cy.get('[name="date"]').type('2025-12-17');
  cy.get('[name="time"]').type('18:00');
  cy.get('[name="location"]').type('Windesheim Zwolle');
  cy.get('[name="description"]').click();
  cy.get('[name="description"]').type('Winterwonderland Festival');
  cy.get('#root input[placeholder="Bijv. Standaard"]').click();
  cy.get('#root input[placeholder="Bijv. Standaard"]').type('Staanplek');
  cy.get('#root input[step="0.01"]').type('10');
  cy.get('#root input[step="1"]').type('100');
  cy.get('#root button.text-white').click();
  cy.get('#root button.bg-gray-100').click();
});

it('Event ticket kopen', function() {
  cy.visit('http://localhost:5173/event/windesheim-winterball')
  
  cy.get('#root button.text-gray-700').click();
  cy.get('#root button.w-full').click();
  cy.get('#firstName').click();
  cy.get('#firstName').type('Chris');
  cy.get('#lastName').click();
  cy.get('#lastName').type('Flow');
  cy.get('#email').click();
  cy.get('#email').type('testertixflow@gmail.com');
  cy.get('#root button.text-white').click();
  
});