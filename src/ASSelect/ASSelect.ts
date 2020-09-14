/// <reference path="../ElementInternals/ElementInternals.d.ts" />
/// <reference path="../declarations.d.ts" />

import ASSelectOption from "./ASSelectOption/ASSelectOption";
import ASComponentBase from "../ASComponentBase";

import html from "./ASSelect.html";
import css from "./ASSelect.scss";

const template = ASComponentBase.prepareTemplate(html, css);

export default class ASSelect extends ASComponentBase {
    static readonly DEFAULT_LIST_HEIGHT = 200;
    static readonly TYPEAHEAD_TIMEOUT = 500;

    static get formAssociated(): boolean { return true; }
    static get observedAttributes(): string[] { return ['disabled', 'clearable', 'searchable']; }

    private internals: ElementInternals;
    private shadow: ShadowRoot;

    private listOpen: boolean;
    private _options: ASSelectOption[];
    private selected?: ASSelectOption;
    private active?: ASSelectOption;

    private listSlot: HTMLSlotElement;
    private input: HTMLInputElement;
    private valueEl: HTMLElement;
    private button: HTMLButtonElement;
    private clearButton: HTMLButtonElement;
    private list: HTMLElement;

    private typeaheadStr = '';
    private typeaheadTimeout: number;

    private desiredValue: string | null | undefined;

    constructor() {
        super();

        this.listOpen = false;
        this._options = [];
        this.selected = undefined;
        this.active = undefined;
        this.desiredValue = undefined;

        this.internals = this.attachInternals();
        this.shadow = this.attachShadow({mode: 'closed'});

        this.shadow.appendChild(template.content.cloneNode(true));

        this.listSlot = this.shadow.getElementById('listSlot') as HTMLSlotElement;
        this.input = this.shadow.getElementById('input') as HTMLInputElement;
        this.valueEl = this.shadow.getElementById('value') as HTMLElement;
        this.list = this.shadow.getElementById('list') as HTMLElement;
        this.button = this.shadow.getElementById('button') as HTMLButtonElement;
        this.clearButton = this.shadow.getElementById('clear') as HTMLButtonElement;

        this.listSlot.addEventListener('slotchange', this.onSlotChange.bind(this));

        this.button.addEventListener('click', this.onSelectButtonClick.bind(this));
        this.clearButton.addEventListener('click', this.onClearButtonClick.bind(this));
        this.list.addEventListener('click', this.onOptionClicked.bind(this));

        this.addEventListener('blur', this.toggleList.bind(this, false, true));

        this.input.addEventListener('input', this.search.bind(this));
        this.addEventListener('keydown', this.onKeyDown.bind(this));
        this.addEventListener('mousemove', this.onMouseMove.bind(this));
    }

    get form(): HTMLFormElement | undefined { return this.internals.form; }
    get labels(): NodeList { return this.internals.labels; }
    get length(): number { return this._options.length; }
    get options(): ASSelectOption[] { return this._options; }
    get selectedIndex(): number { return this.selected ? this.selected.index : -1; }
    get selectedOption(): ASSelectOption | undefined { return this.selected; }
    item(i: number): ASSelectOption | undefined { return this.options[i]; }
    get name(): string | null { return this.getAttribute('name'); }
    set name(v: string | null) { this.setAttributeValue('name', v); }
    get type(): string { return this.localName; }

    get value(): string | null { return this.selected ? this.selected.value : null }
    set value(v: string | null) {
        this.desiredValue = v;
        const el = this._options.find(el => el.value == v);
        this.setSelected(el);
    }

    get disabled(): boolean { return this.hasAttribute('disabled'); }
    set disabled(v: boolean) { this.setAttributeValue('disabled', v); }

    get searchable(): boolean { return this.hasAttribute('searchable'); }
    set searchable(v: boolean) { this.setAttributeValue('searchable', v); }

    get clearable(): boolean { return this.hasAttribute('clearable'); }
    set clearable(v: boolean) { this.setAttributeValue('clearable', v); }

    connectedCallback(): void {
        this.toggleDisabled();
        this.toggleClearable();
        this.toggleSearchable();
        this.initA11y();
        this.upgradeProperty('value');
    }

    formResetCallback(): void {
        this.desiredValue = null;
        this.initOptions();
    }

    formDisabledCallback(disabled: boolean): void {
        this.toggleDisabled(disabled);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    formStateRestoreCallback(state: string | null, mode: string): void {
        this.value = state;
    }

    private toggleDisabled(disabled: boolean | undefined = undefined): void {
        if (typeof disabled == 'undefined') disabled = this.disabled;

        this.input.disabled = disabled;
        this.button.disabled = disabled;
        this.clearButton.disabled = disabled;
        if (disabled) {
            this.toggleList(false);
            this.internals.setFormValue(null);
            this.blur();
        } else {
            this.internals.setFormValue(this.value);
        }
        this.initTabIndex(disabled);
    }

    private initTabIndex(disabled: boolean): void {
        this.setAttributeIfNotSetByAuthor('tabindex', disabled ? undefined : '0');
    }

    private initA11y(): void {
        this.setAttributeIfNotSetByAuthor('role', 'listbox');
    }

    private toggleClearable(): void {
        this.clearButton.hidden = !this.clearable;
        if (!this.clearable) this.setSelected(this.selected);
    }

    private toggleSearchable(): void {
        this.input.hidden = !this.searchable;
        this.valueEl.hidden = this.searchable;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
        switch (name) {
            case 'disabled':
                this.toggleDisabled();
                break;
            case 'searchable':
                this.toggleSearchable();
                break;
            case 'clearable':
                this.toggleClearable();
                break;
        }
    }

    private initOptions(): void {
        this.toggleList(false);

        this._options = [];
        let toSelect: ASSelectOption | undefined = undefined;

        let i = 0;
        const push = (el: ASSelectOption): void => {
            el.selected = el.hasAttribute('selected');
            if (el.selected || el.value === this.desiredValue) {
                if (!toSelect) {
                    toSelect = el;
                }
                else el.selected = false;
            }
            el.index = i;
            this._options.push(el);
            i++;
        };

        for (const el of this.listSlot.assignedElements()) {
            if (el instanceof ASSelectOption) {
                push(el);
            } else {
                for (const optEl of el.getElementsByTagName('as-option')){
                    push(optEl as ASSelectOption);
                }
            }
        }

        this.setSelected(toSelect);
    }

    private shiftActive(next = true): void {
        let start: number;
        if (this.active) {
            start = this.active.index;
        } else {
            start = next ? this._options.length - 1 : 0;
        }
        const inc = next ? 1 : -1;

        let i = start;
        let el: ASSelectOption;

        do {
            i += inc;
            if (i < 0) i = this._options.length + i;
            if (i >= this._options.length) i -= this._options.length;

            el = this._options[i];
        } while (i != start && el && el.filtered);

        this.setActive(el);
    }

    private setActive(el?: ASSelectOption): void {
        if (this.active) {
            this.active.active = false;
        }

        this.active = el;
        if (this.active) {
           this.active.active = true;

           //let the list actually appear before scrolling
           setTimeout(() => {
               if (this.active) {
                   this.active.scrollIntoView({block: "nearest"});
               }
           }, 0);
        }
    }

    private search(): void {
        this.toggleList(true, false);

        const term = this.input.value.toLowerCase();

        this._options.map(el => {
            el.filtered = el.textContent ? el.textContent.toLowerCase().indexOf(term) < 0 : term == '';
        });

        if (!this.active || this.active.filtered) {
            this.shiftActive();
        }
    }

    private typeahead(char: string): void {
        this.toggleList(true);

        clearTimeout(this.typeaheadTimeout);
        this.typeaheadStr += char.toLowerCase();

        const el = this._options.find(el => el.textContent ? el.textContent.toLowerCase().startsWith(this.typeaheadStr) : false);
        if (el) this.setActive(el);

        this.typeaheadTimeout = window.setTimeout(() => this.typeaheadStr = '', ASSelect.TYPEAHEAD_TIMEOUT);
    }

    private setSelected(el?: ASSelectOption, interactive = false): void {
        if (interactive) {
            if (el) this.desiredValue = el.value; else this.desiredValue = null;
        }

        if (!this.clearable && !el && this._options.length) {
            el = this._options[0];
        }

        if (this.selected == el) return;

        if (this.selected) {
            this.selected.selected = false;
        }
        this.selected = el;

        if (this.selected) {
            this.selected.selected = true;
            this.input.value = this.selected.textContent ?? '';
            this.valueEl.textContent = this.selected.textContent;
            this.internals.setFormValue(this.selected.value);
        } else {
            this.input.value = '';
            this.valueEl.textContent = '';
            this.internals.setFormValue(null);
        }

        if (interactive) {
            this.dispatchEvent(new Event('change'))
        }
    }

    private positionList(): void {
        const rect = this.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        let listHeight = Math.min(ASSelect.DEFAULT_LIST_HEIGHT, this.list.scrollHeight);
        let bottom = true;
        if (listHeight > viewportHeight - rect.bottom) {
            if (viewportHeight - rect.bottom >= rect.top) {
                listHeight = viewportHeight - rect.bottom;
            } else {
                listHeight = Math.min(ASSelect.DEFAULT_LIST_HEIGHT, rect.top);
                bottom = false;
            }
        }

        this.list.style.bottom = bottom ? 'auto' : this.clientHeight + 'px';
        this.list.style.maxHeight = listHeight + 'px';
    }

    private toggleList(show: boolean, shouldSelect = true): void {
        if (this.listOpen == show) return;
        this.listOpen = show;
        if (!show) {
            if (this.selected && this.selected.textContent) this.input.value = this.selected.textContent; else this.input.value = '';
            this.list.className = 'closed';
        } else {
            this._options.map(el => el.filtered = false);
            this.input.focus();
            if (shouldSelect) this.input.select();

            this.positionList();

            if (this.selected)
                this.setActive(this.selected);
            else if (this._options.length > 0)
                this.setActive(this._options[0]);

            this.list.className = '';
        }
    }

    private onOptionClicked(event: MouseEvent): void {
        const target = event.target;
        if (target instanceof ASSelectOption) {
            this.setSelected(target, true);
            this.toggleList(false);
        }
        event.stopPropagation();
    }

    private onSelectButtonClick(): void {
        this.toggleList(!this.listOpen);
    }

    private onClearButtonClick(): void {
        this.toggleList(false);
        this.setSelected(undefined, true);
    }

    private onSlotChange(): void {
        this.initOptions();
    }

    private onKeyDown(event: KeyboardEvent): void {
        if (event.altKey) return;

        if (!this.listOpen) {
            switch (event.key) {
                case ' ':
                case 'ArrowDown':
                case 'ArrowUp':
                case 'Up':
                case 'Down':
                case 'Home':
                case 'End':
                    this.toggleList(true);
                    event.preventDefault();
                    return;
                case 'Enter':
                    if (this.form)
                        this.form.submit();
                    break;
                case 'Backspace':
                case 'Left':
                case 'ArrowLeft':
                case 'Right':
                case 'ArrowRight':
                    if (this.searchable) this.input.focus();
                    break;
                default:
                    if (event.key.length === 1 && this.searchable) this.input.select();
            }
        } else {
            switch (event.key) {
                case 'Enter':
                    this.setSelected(this.active, true);
                    this.toggleList(false);
                    event.preventDefault();
                    break;
                case 'ArrowDown':
                case 'Down':
                    this.shiftActive(true);
                    event.preventDefault();
                    break;
                case 'ArrowUp':
                case 'Up':
                    this.shiftActive(false);
                    event.preventDefault();
                    break;
                case 'Home':
                    if (this.options.length)
                        this.setActive(this.options[0]);
                    event.preventDefault();
                    break;
                case 'End':
                    if (this.options.length)
                        this.setActive(this.options[this.options.length - 1]);
                    event.preventDefault();
                    break;
                case 'Escape':
                    this.toggleList(false);
            }
        }

        if (!this.searchable && event.key.length === 1) {
            this.typeahead(event.key);
        }
    }

    private onMouseMove(event: MouseEvent): void {
        const target = event.target;
        if (target instanceof ASSelectOption) {
            this.setActive(target);
        }
    }
}
