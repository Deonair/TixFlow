describe('template spec', () => {
  it('passes', () => {

  });

  it('Make Event', function() {
    cy.visit('http://localhost:5173/')
    cy.get('#root a[href="/login"]').click();
    cy.get('#email').click();
    cy.get('#email').type('deo@tixflow.nl');
    cy.get('#password').click();
    cy.get('#password').type('Test123#');
    cy.get('#root button.w-full').click();
    cy.get('#root button.px-3').click();
    cy.get('[name="title"]').click();
    cy.get('[name="title"]').type('Kerstdiner');
    cy.get('[name="date"]').click();
    cy.get('[name="date"]').type('2025-12-26');
    cy.get('[name="time"]').type('20:00');
    cy.get('[name="location"]').click();
    cy.get('[name="location"]').type('Windesheim Almere');
    cy.get('[name="description"]').click();
    cy.get('[name="description"]').type('Gezellige Kerstborrel');
    cy.get('#root input[placeholder="Bijv. Standaard"]').click();
    cy.get('#root input[placeholder="Bijv. Standaard"]').type('Eetplek');
    cy.get('#root input[step="0.01"]').click();
    cy.get('#root input[step="0.01"]').type('10');
    cy.get('#root input[step="1"]').click();
    cy.get('#root input[step="1"]').type('100');
    cy.get('#root button.text-white').click();
  });
});

it('Ticketkopen', function() {
  cy.visit('http://localhost:5173/event/kerstdiner')
  cy.get('#root button.text-gray-700').click();
  cy.get('#root button.w-full').click();
  cy.get('#firstName').click();
  cy.get('#firstName').type('Petroll');
  cy.get('#lastName').click();
  cy.get('#lastName').type('Diddler');
  cy.get('#email').click();
  cy.get('#email').type('deonair@icloud.com');
  cy.get('#root button.text-white').click();
  
});