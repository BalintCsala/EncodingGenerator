import style from "./NumberInput.module.css";
import {useCallback, useRef, useState} from "react";

interface Props {
    min?: number;
    max?: number;
    step?: number;
    defaultValue?: number;
    onChange: (value: number) => void;
}

function stripTrailingZeroes(value: string) {
    return value.replace(/\.?0+$/, "");
};

function NumberInput({min, max, step, defaultValue, onChange}: Props) {
    const [tempValue, setTempValue] = useState<string | null>(null);
    const [value, setValue] = useState(defaultValue ?? min ?? max ?? 0);
    const ref = useRef<HTMLInputElement>(null);

    const changeValue = useCallback((value: number) => {
        setTempValue(null);
        if (isNaN(value)) return;
        value = Math.max(min ?? -Infinity, Math.min(max ?? Infinity, value));
        value =
            Math.round((value - (min ?? 0)) / (step ?? 1)) * (step ?? 1) +
            (min ?? 0);

        setValue(value);
        onChange(value);
    }, []);

    return (
        <div className={style.numberInput}>
            <input
                ref={ref}
                type="number"
                value={(tempValue ?? stripTrailingZeroes(value.toFixed(6)))}
                min={min}
                max={max}
                onBlur={() =>
                    changeValue(parseFloat(ref.current?.value ?? "0"))
                }
                onChange={() => setTempValue(ref.current?.value ?? "0")}
                onKeyDown={e => {
                    if (e.key === "Enter") {
                        changeValue(parseFloat(tempValue ?? "0"));
                    }
                }}
            />
            <button onClick={() => changeValue(value + (step ?? 1))}>+</button>
            <button onClick={() => changeValue(value - (step ?? 1))}>-</button>
        </div>
    );
}

export default NumberInput;
