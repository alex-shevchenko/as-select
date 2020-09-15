'use strict';

const OPTIONS_COUNT = 30;
function getOptions() {
  const container = document.createElement('div');
  for (let i = 0; i < OPTIONS_COUNT; i++) {
    const option = document.createElement('as-option');
    option.value = 'value' + i;
    option.textContent = 'Test option ' + i;
    container.appendChild(option);
  }
  return container;
}

function getVisibleRect(el) {
  const rect1 = el.getBoundingClientRect();
  const rect = { top: rect1.top, bottom: rect1.bottom, left: rect1.left, right: rect1.right };
  while (el.parentElement) {
    el = el.parentElement;
    const overflow = getComputedStyle(el).overflow;
    if (overflow == 'visible') continue;

    const rect2 = el.getBoundingClientRect();

    rect.left = Math.max(rect.left, rect2.left);
    rect.top = Math.max(rect.top, rect2.top);

    rect.right = Math.min(rect.right, rect2.right);
    rect.bottom = Math.min(rect.bottom, rect2.bottom);
  }

  rect.height = rect.bottom - rect.top;
  rect.width = rect.right - rect.left;

  return rect;
}

function checkActive(element, expected) {
  for (let i = 0; i < OPTIONS_COUNT; i++) {
    const option = element.item(i);
    const activePart = option.shadowRoot.querySelector('[part~=active]');
    if (i === expected) {
      expect(activePart).is.an.instanceof(HTMLElement);
      expect(getVisibleRect(option).height).is.equal(option.clientHeight);
    }
    else expect(activePart).is.a.null;
  }
}

describe('as-select', function () {
  before(function () {
    this.appendOptions = async function (options = null) {
      if (!options) options = getOptions();
      this.element.appendChild(options);

      return new Promise((resolve) => setTimeout(resolve));
    }

    createContainer.call(this, 'form');
    openShadow.call(this);
  });
  after(function() {
    removeContainer.call(this);
    restoreShadow.call(this);
  });
  beforeEach(createCustomElement('as-select'));
  afterEach(removeCustomElement);

  it('should add a [role] to the listbox and [tabindex] to 0', function () {
    expect(this.element.getAttribute('role')).to.equal('listbox');
    expect(this.element.getAttribute('tabindex')).to.equal('0');
  });

  describe('form', function() {
    it('.type should be "as-select"', function() {
      expect(this.element.type).to.equal('as-select');
    });
    it('.form should return parent form', function() {
      expect(this.element.form).to.equal(this.container);
    });
    it('.labels should return associated <label>', function () {
      const label = document.createElement('label');
      this.element.id = 'test';
      label.setAttribute('for', 'test');
      this.container.appendChild(label);
      expect(this.element.labels.length).to.equal(1);
      expect(this.element.labels[0]).to.equal(label);
      label.remove();
    });
  });

  describe('disabled', attributePropertyTest('disabled', true, false, 'and set/remove tabindex', function(name, value) {
    expect(this.element.hasAttribute('tabindex')).to.equal(!value);
  }));

  describe('name', attributePropertyTest('name', 'testName'));

  describe('searchable', function() {
    describe('set', attributePropertyTest('searchable', true, false));

    it('entering letter on not searchable element should start typeahead', async function() {
      this.element.clearable = false;
      this.element.searchable = false;
      await this.appendOptions();
      const option1 = document.createElement('as-option');
      option1.value = 'ab';
      option1.textContent = 'ab';
      const option2 = document.createElement('as-option');
      option1.value = 'ac';
      option1.textContent = 'ac';
      await this.appendOptions(option1);
      await this.appendOptions(option2);

      await simulateKeyboardEvent(this.element, 'a');
      checkActive(this.element, OPTIONS_COUNT);

      await simulateKeyboardEvent(this.element, 'c');
      checkActive(this.element, OPTIONS_COUNT + 1);

      await simulateKeyboardEvent(this.element, 'd');
      checkActive(this.element, OPTIONS_COUNT + 1);
    });

    it('search should filter options list', async function() {
      this.element.searchable = true;
      await this.appendOptions();

      const inputEl = this.element.shadowRoot.querySelector('[part=input]');

      inputEl.value = 'Test option 1';
      const event = new InputEvent('input');
      inputEl.dispatchEvent(event);
      await tick();

      for (const option of this.element.options) {
        expect(option.filtered).to.not.equal(option.textContent.startsWith('Test option 1'));
      }
    });

    it('backspace/arrows should focus on input if element is searchable', async function () {
      const inputEl = this.element.shadowRoot.querySelector('[part=input]');

      for (const key of ['Backspace', 'Left', 'Right', 'ArrowLeft', 'ArrowRight']) {
        this.element.searchable = true;
        expect(this.element.shadowRoot.activeElement).to.not.equal(inputEl);

        await simulateKeyboardEvent(this.element, key);
        expect(this.element.shadowRoot.activeElement).to.equal(inputEl);

        this.element.searchable = false;
        expect(this.element.shadowRoot.activeElement).to.not.equal(inputEl);

        await simulateKeyboardEvent(this.element, key);
        expect(this.element.shadowRoot.activeElement).to.not.equal(inputEl);
      }
    });

    it('entering letter on searchable element should focus on input', async function() {
      this.element.searchable = true;
      const inputEl = this.element.shadowRoot.querySelector('[part=input]');
      await this.appendOptions();
      expect(this.element.shadowRoot.activeElement).to.not.equal(inputEl);

      await simulateKeyboardEvent(this.element, 'v');
      expect(this.element.shadowRoot.activeElement).to.equal(inputEl);
    });
  });

  describe('clearable', function () {
    describe('set', attributePropertyTest('clearable', true, false, 'and clear button should be shown/hidden correspondingly', function (name, value) {
      expect(this.element.shadowRoot.querySelector('[part=clear]').hidden).to.not.equal(value);
    }));

    it('not clearable list should select first option by default and should not allow to clear it', async function() {
      this.element.clearable = false;
      await this.appendOptions();

      expect(this.element.value).to.equal('value0');

      this.element.value = null;
      expect(this.element.value).to.equal('value0');
    });

    it('clearable list should not have any option selected by default and should allow to clear selection', async function() {
      this.element.clearable = true;
      await this.appendOptions();

      expect(this.element.value).to.be.a('null');

      this.element.value = 'value0';
      expect(this.element.value).to.equal('value0');

      this.element.value = null;
      expect(this.element.value).to.be.a('null');
    });

    it('clear button should clear the value', async function() {
      await(this.appendOptions());
      this.element.clearable = true;

      expect(this.element.value).to.equal('value0');

      this.element.shadowRoot.querySelector('[part=clear]').click();
      expect(this.element.value).to.be.a('null');
    })
  });

  describe('init options', function() {
    it('.options should return all options and .length should return corresponding length', async function() {
      expect(this.element.options.length).to.equal(0);
      expect(this.element.length).to.equal(0);

      await this.appendOptions();

      expect(this.element.options.length).to.equal(OPTIONS_COUNT);
      expect(this.element.length).to.equal(OPTIONS_COUNT);
      this.element.options.forEach((option) => expect(option).is.an.instanceof(ASSelect.ASSelectOption));
    });

    it('setting options without [selected] and .value and without [clearable] should make first option selected', async function() {
      await this.appendOptions();

      expect(this.element.selectedIndex).to.equal(0);
      expect(this.element.selectedOption.value).to.equal('value0');
      expect(this.element.value).to.be.equal('value0');
    });

    it('setting options without [selected] and .value and with [clearable] should keep nothing selected', async function() {
      this.element.clearable = true;

      await this.appendOptions();

      expect(this.element.selectedIndex).to.equal(-1);
      expect(this.element.selectedOption).to.be.an('undefined');
      expect(this.element.value).to.be.a('null');
    });

    it('setting .value before options should select corresponding option if it is present', async function() {
      expect(this.element.value).to.be.a('null');
      this.element.value = 'value3';

      await this.appendOptions();

      expect(this.element.selectedOption.value).to.be.equal('value3');
      expect(this.element.value).to.be.equal('value3');
    });

    it('setting options with [selected] should make first of them selected', async function() {
      const options = getOptions();
      options.getElementsByTagName('as-option')[4].setAttribute('selected', '');
      options.getElementsByTagName('as-option')[6].setAttribute('selected', '');

      await this.appendOptions(options);

      expect(this.element.selectedOption.value).to.be.equal('value4');
      expect(this.element.value).to.be.equal('value4');
    });

    it('appending option with [selected] should change selection if it was not set earlier', async function() {
      await this.appendOptions();

      const option = document.createElement('as-option');
      option.setAttribute('selected', '');
      option.value = 'newValue';

      await this.appendOptions(option);

      expect(this.element.selectedOption).to.equal(option);
    });

    it('appending option with [selected] should not change selection if it was set earlier', async function() {
      await this.appendOptions();

      this.element.value = 'value3';

      const option = document.createElement('as-option');
      option.setAttribute('selected', '');
      option.value = 'newValue';

      await this.appendOptions(option);

      expect(this.element.selectedOption.value).to.equal('value3');
    });
  });

  describe('value', function() {
    beforeEach(async function() {
      await this.appendOptions()
    });

    it('setting .value should change selected option correspondingly', function() {
      this.element.value = 'value5';
      expect(this.element.selectedIndex).to.equal(5);
      expect(this.element.selectedOption.value).to.equal('value5');
      expect(this.element.value).to.equal('value5');
    });

    it('setting wrong value with [clearable] should clear the selection', function() {
      this.element.clearable = true;

      this.element.value = 'value2';
      expect(this.element.selectedOption).to.be.not.a('null');

      this.element.value = 'wrongValue';
      expect(this.element.selectedOption).to.be.an('undefined');
      expect(this.element.value).to.be.a('null');
    });

    it('setting wrong value without [clearable] should select first option', function() {
      this.element.value = 'value2';
      expect(this.element.selectedIndex).to.be.above(0);

      this.element.value = 'wrongValue';
      expect(this.element.selectedIndex).to.equal(0);
    });
  })

  it('.item(x) should return corresponding option', async function() {
    await this.appendOptions();

    for (let i = 0; i < OPTIONS_COUNT; i++) {
      expect(this.element.item(i).value).to.equal('value' + i);
    }
  });

  it('.formStateRestoreCallback should set value', async function() {
    await this.appendOptions();

    this.element.formStateRestoreCallback('value3', 'test');
    expect(this.element.value).to.equal('value3');
  })

  describe('reset', function() {
    beforeEach(async function() {
      await this.appendOptions();

      this.element.value = 'value3';
      expect(this.element.value).to.equal('value3');
    });

    it('resetting form should select first [selected] if present', function() {
      this.element.item(4).setAttribute('selected', '');
      this.element.item(6).setAttribute('selected', '');

      this.container.reset();

      expect(this.element.value).to.equal('value4');
    });

    it('resetting form having no [selected] options and [clearable] should make nothing selected', function() {
      this.element.clearable = true;
      this.container.reset();

      expect(this.element.value).to.be.a('null');
    });

    it('resetting form having no [selected] options and no [clearable] should make first option selected', function() {
      this.container.reset();

      expect(this.element.selectedIndex).to.equal(0);
    });
  });

  describe('list', function() {
    describe('opening/closing', function() {
      it('arrows-up/arrow-down/home/end/space should open list, escape should close list', async function() {
        const listEl = this.element.shadowRoot.querySelector('[part=list]');
        expect(listEl).is.an.instanceof(HTMLElement);

        const height = () => getVisibleRect(listEl).height;

        await this.appendOptions();
        expect(height()).to.be.equal(0);

        for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End', ' ', 'Down', 'Up']) {
          await simulateKeyboardEvent(this.element, key);
          expect(height()).to.be.above(0);

          await simulateKeyboardEvent(this.element,'Escape');
          expect(height()).to.be.equal(0);
        }
      });

      it('opening list in the bottom of the screen should move it above the element and keep visible', async function() {
        await this.appendOptions();

        this.element.searchable = true;

        const height = document.documentElement.clientHeight;
        const listEl = this.element.shadowRoot.querySelector('[part=list]');
        const inputEl = this.element.shadowRoot.querySelector('[part=input]');

        const div = document.createElement('div');
        div.style.height = (height - 100) + 'px';

        document.body.prepend(div);

        await simulateKeyboardEvent(this.element, 'ArrowDown');
        const listRect = listEl.parentElement.getBoundingClientRect();
        const elRect = inputEl.getBoundingClientRect();

        expect(listRect.height).to.equal(getVisibleRect(listEl.parentElement).height);
        expect(listRect.y).to.below(elRect.y);
        expect(listRect.y + listRect.height).to.equal(elRect.y);

        document.body.removeChild(div);
      });

      it('clicking on list button should toggle list', async function() {
        const listEl = this.element.shadowRoot.querySelector('[part=list]');
        expect(listEl).is.an.instanceof(HTMLElement);

        const height = () => getVisibleRect(listEl).height;

        await this.appendOptions();
        expect(height()).to.be.equal(0);

        const buttonEl = this.element.shadowRoot.querySelector('[part=button]');
        buttonEl.click();
        await tick();

        expect(height()).to.be.above(0);

        buttonEl.click();
        await tick();

        expect(height()).to.be.equal(0);
      });
    })

    describe('active element', function() {
      it('arrow-down should loop thru all options and return to the first one', async function() {
        await this.appendOptions();

        await simulateKeyboardEvent(this.element, 'ArrowDown');
        await simulateKeyboardEvent(this.element, 'ArrowDown');

        checkActive(this.element, 1);

        for (let i = 0; i < OPTIONS_COUNT - 1; i++) {
          await simulateKeyboardEvent(this.element, 'ArrowDown');
        }

        checkActive(this.element, 0);
      });

      it('arrow-up should jump to last element', async function() {
        await this.appendOptions();

        await simulateKeyboardEvent(this.element, 'ArrowUp');
        await simulateKeyboardEvent(this.element, 'ArrowUp');

        checkActive(this.element, OPTIONS_COUNT - 1);
      });

      it('home/end should make first/last option active when list is open', async function() {
        await this.appendOptions();

        await simulateKeyboardEvent(this.element, 'ArrowDown');
        checkActive(this.element, 0);
        await simulateKeyboardEvent(this.element, 'End');
        checkActive(this.element, OPTIONS_COUNT - 1);
        await simulateKeyboardEvent(this.element, 'Home');
        checkActive(this.element, 0);
      });

      //TODO test mousemove via e2e
    })

    describe('selection', function() {
      it('enter should submit the form when list is closed', async function() {
        const formSpy = chai.spy.on(this.element.form, 'submit', () => { /* do nothing */ });
        await simulateKeyboardEvent(this.element, 'Enter');

        expect(formSpy).to.have.been.called();
      });

      it('enter should set value to selected option when list is open', async function() {
        this.element.clearable = true;
        await this.appendOptions();
        expect(this.element.value).to.equal(null);

        await simulateKeyboardEvent(this.element, 'ArrowDown');
        await simulateKeyboardEvent(this.element, 'ArrowDown');
        await simulateKeyboardEvent(this.element, 'Enter');

        expect(this.element.value).to.equal('value1');
      });

      it('click on option should select it', async function() {
        await this.appendOptions();
        await simulateKeyboardEvent(this.element, 'ArrowDown');

        this.element.item(3).click();
        await tick();

        expect(this.element.value).to.equal('value3');
      });
    });

    describe('disabled options', async function() {
      beforeEach(async function() {
        await this.appendOptions();

        this.element.item(OPTIONS_COUNT - 2).disabled = true;
      });

      it ('keyboard navigation should not stop on disabled options', async function() {
        await simulateKeyboardEvent(this.element, 'ArrowDown');
        checkActive(this.element, 0);

        await simulateKeyboardEvent(this.element, 'ArrowUp');
        checkActive(this.element, OPTIONS_COUNT - 1);

        await simulateKeyboardEvent(this.element, 'ArrowUp');
        checkActive(this.element, OPTIONS_COUNT - 3);

        await simulateKeyboardEvent(this.element, 'ArrowDown');
        checkActive(this.element, OPTIONS_COUNT - 1);
      });

      it ('click on disabled option should do nothing', async function() {
        this.element.clearable = false;
        expect(this.element.value).to.equal('value0');

        await simulateKeyboardEvent(this.element, 'ArrowDown');
        this.element.item(OPTIONS_COUNT - 2).click();
        await tick();

        expect(this.element.value).to.equal('value0');
      })
    });
  });
});
