type FormValue = File | string | FormData | null;

interface ValidityStateFlags {
    valueMissing?: boolean;
    typeMismatch?: boolean;
    patternMismatch?: boolean;
    tooLong?: boolean;
    tooShort?: boolean;
    rangeUnderflow?: boolean;
    rangeOverflow?: boolean;
    stepMismatch?: boolean;
    badInput?: boolean;
    customError?: boolean;
}

interface ElementInternals {
    readonly form?: HTMLFormElement;
    readonly labels: NodeList;
    readonly validationMessage: string;
    readonly validity: ValidityState;
    readonly willValidate: boolean;
    checkValidity(): boolean;
    reportValidity(): boolean;
    setFormValue(value: FormValue, state?: FormValue): void;
    setValidity(flags: ValidityStateFlags, message?: string, anchor?: HTMLElement): void;
}

interface HTMLElement {
    attachInternals(): ElementInternals;
    readonly part: DOMTokenList;
}
