/// <reference path="../ElementInternals/ElementInternals.d.ts" />

if (!HTMLElement.prototype.attachInternals) {
    interface FormAssociatedElement extends HTMLElement{
        readonly form: HTMLFormElement;
        readonly name: string;
        readonly disabled: boolean;
        readonly formResetCallback: () => void;
        readonly formDisabledCallback: (disabled: boolean) => void;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isFormAssociatedElement = function(el: any): el is FormAssociatedElement {
        if ('formAssociated' in el.constructor) {
            return el.constructor.formAssociated;
        } else return false;
    }

    class ElementInternalsPolyfill implements ElementInternals {
        get labels(): NodeList {
            throw "Not implemented";
        }

        get validationMessage(): string {
            throw "Not implemented";
        }

        get validity(): ValidityState {
            throw "Not implemented";
        }

        get willValidate(): boolean {
            throw "Not implemented";
        }

        private readonly el: HTMLElement;
        private readonly formAssocEl: FormAssociatedElement | undefined;
        private readonly hiddenEl: HTMLInputElement;
        private formEl: HTMLFormElement | undefined;
        private readonly formResetEventListener: () => void;
        private readonly mutationObserver: MutationObserver;

        constructor(el: HTMLElement) {
            this.el = el;
            this.hiddenEl = document.createElement('input');
            this.hiddenEl.type = 'hidden';
            this.formResetEventListener = this.onFormReset.bind(this);
            if (isFormAssociatedElement(el)) {
                this.formAssocEl = this.el as FormAssociatedElement;
                this.mutationObserver = new MutationObserver(this.onElementMutation.bind(this));
                this.mutationObserver.observe(el, { 'attributes': true, attributeFilter: ['disabled'] });
                setTimeout(() => { if (this.formAssocEl?.disabled) this.formAssocEl.formDisabledCallback(true); }, 0);
            }
        }

        get form(): HTMLFormElement | undefined {
            if (!this.formAssocEl) throw ElementInternalsPolyfill.notFormAssociatedError();

            this.initForm();
            return this.formEl;
        }

        private initForm(): void {
            const form = this.findForm();
            if (form != this.formEl) {
                this.formEl?.removeEventListener('reset', this.formResetEventListener);
                this.hiddenEl.parentElement?.removeChild(this.hiddenEl);

                form?.appendChild(this.hiddenEl);
                form?.addEventListener('reset', this.formResetEventListener);

                this.formEl = form;
            }
        }

        private findForm(): HTMLFormElement | undefined {
            if (this.el.hasAttribute('form')) {
                const form = document.getElementById(this.el.getAttribute('form') as string);
                if (form instanceof HTMLFormElement) return form;
            }

            let el: HTMLElement | null = this.el.parentElement;
            while (el) {
                if (el instanceof HTMLFormElement) {
                    return el;
                }
                el = el.parentElement;
            }
            return undefined;
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        setFormValue(value: File | string | FormData | null, state?: File | string | FormData | null): void {
            if (!this.formAssocEl) throw ElementInternalsPolyfill.notFormAssociatedError();

            this.initForm();
            this.hiddenEl.name = this.formAssocEl.name;
            if (typeof value == 'string') {
                this.hiddenEl.value = value;
                this.hiddenEl.disabled = false;
            } else if (value == null) {
                this.hiddenEl.disabled = true;
            } else {
                throw "Not implemented";
            }
        }

        private onFormReset(): void {
            this.formAssocEl?.formResetCallback();
        }

        private onElementMutation(mutationList: MutationRecord[]): void {
            if (!this.formAssocEl) return;

            for (const mutation of mutationList) {
                if (mutation.type == "attributes" && mutation.attributeName == "disabled") {
                    this.formAssocEl.formDisabledCallback(this.formAssocEl.disabled);
                }
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        setValidity(flags: ValidityStateFlags, message?: string, anchor?: HTMLElement): void {
            throw "Not implemented";
        }

        checkValidity(): boolean {
            throw "Not implemented";
        }

        reportValidity(): boolean {
            throw "Not implemented";
        }

        private static notFormAssociatedError(): DOMException {
            return new DOMException("element is not form-associated", "NotSupportedError");
        }
    }

    HTMLElement.prototype.attachInternals = function (): ElementInternals {
        return new ElementInternalsPolyfill(this);
    };
}
