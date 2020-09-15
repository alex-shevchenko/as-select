'use strict';

function shadowPartTest(name, value) {
    const part = this.element.shadowRoot.querySelector(`[part~=${name}]`);
    if (value) expect(part).is.an.instanceof(HTMLElement);
    else expect(part).is.a('null');
}

describe('as-option', function () {
    before(function () {
        createContainer.call(this);
        openShadow.call(this);
    });
    after(function() {
        removeContainer.call(this);
        restoreShadow.call(this);
    });
    beforeEach(createCustomElement('as-option'));

    it('should add a [role] to the option', function () {
        expect(this.element.getAttribute('role')).to.equal('option');
    });

    describe('value', attributePropertyTest('value', 'testValue'));

    describe('disabled', attributePropertyTest('disabled', true, false, 'and set part "disabled"', shadowPartTest));

    describe('selected', booleanPropertyTest('selected', false, 'and set part "selected"', shadowPartTest));

    describe('active', booleanPropertyTest('active', false, 'and set part "active"', shadowPartTest));

    describe('filtered', booleanPropertyTest('filtered', false, 'and set part "filtered"', shadowPartTest));
});
