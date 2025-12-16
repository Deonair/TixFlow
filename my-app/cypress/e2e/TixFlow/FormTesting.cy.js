describe('template spec', () => {
  it('passes', () => {
    cy.visit('https://example.cypress.io')
  })
});

it('Invalid Login Credentials', function() {
     cy.visit('https://tixflow.nl/')
     cy.get('#root a[href="/login"]').click();
     cy.get('#email').click();
  cy.get('#email').type('Test@test.nl');
  cy.get('#password').click();
  cy.get('#password').type('Test123');
  cy.get('button[type="submit"]').click();
  cy.get('#password').click();
  cy.get('#password').clear();
  cy.get('html').click();
  cy.get('button[type="submit"]').click();
  cy.get('#email').click();
  cy.get('#email').clear();
  cy.get('button[type="submit"]').click();
     
});

it('Invalid Payment Credentials', function() {
  cy.visit('https://tixflow.nl//kerstdiner')
  
  cy.get('#root button[aria-label="Verhoog aantal"]').first().click();
  cy.contains('button', 'Koop nu').click();
  cy.get('#firstName').click();
  cy.get('#firstName').type('Jeff@');
  cy.get('#lastName').click();
  cy.get('#lastName').type('A');
  cy.get('#email').click();
  cy.get('#lastName').click();
  cy.get('#lastName').type('.');
  cy.get('#email').click();
  cy.get('#email').type('Test@.co');
  cy.contains('button', 'Ga verder naar betalen').click();
  cy.get('#email').type('m');
  cy.contains('button', 'Ga verder naar betalen').click();
  cy.get('#email').click();
  cy.get('#email').clear();
  cy.get('#email').type('Test@ll.com');
  cy.contains('button', 'Ga verder naar betalen').click();
  
});

it('Invalid Event Form Credentials', function() {
  cy.visit('https://tixflow.nl/')
  
  cy.get('#root a[href="/login"]').click();
  cy.get('#email').click();
  cy.get('#email').type('chris@tixflow.nl');
  cy.get('#password').type('test123#');
  cy.contains('button', 'Login').click();
  cy.contains('button', 'Nieuw event').click();
  cy.get('[name="title"]').click();
  cy.get('[name="title"]').type('@@');
  cy.get('[name="location"]').click();
  cy.get('[name="location"]').type('Test Not Existing ST 13009');
  cy.contains('button', 'Event Aanmaken').click();
  cy.get('[name="title"]').click();
  cy.get('[name="title"]').clear();
  cy.get('[name="date"]').click();
  cy.get('[name="date"]').type('2025-12-16');
  cy.contains('button', 'Event Aanmaken').click();
  cy.get('[name="title"]').click();
  cy.get('[name="title"]').type('@@');
  cy.contains('button', 'Event Aanmaken').click();
  
});
