import NumberInput from "../../../common/NumberInput";
import style from "./ParameterSettings.module.css";

export interface Parameter {
    id: number;
    name: string;
    length: number;
    minimum: number;
    maximum: number;
}

interface Props {
    id: number;
    parameter: Parameter;
    onChange: (change: Partial<Parameter>) => void;
    canDelete: boolean;
    onDelete: () => void;
}

function ParameterSettings({
    id,
    parameter,
    onChange,
    canDelete,
    onDelete,
}: Props) {
    return (
        <div className={style.container}>
            <header>
                <span className={style.title}>Parameter #{id + 1}</span>
                {canDelete && <button onClick={() => onDelete()}>X</button>}
            </header>
            <span className={style.label}>Parameter name:</span>
            <br />
            <input
                type="text"
                value={parameter.name}
                onChange={e => onChange({name: e.target.value})}
                onBlur={() =>
                    onChange({
                        name: parameter.name.trim().replace(/\s/g, "_"),
                    })
                }
                className={style.nameInput}
            />
            <br />
            <span className={style.label}>Storage bit length:</span>
            <NumberInput
                min={1}
                max={32}
                defaultValue={parameter.length}
                onChange={length => onChange({length})}
            />
            <span className={style.label}>Input minimum expected value:</span>
            <NumberInput
                defaultValue={parameter.minimum}
                step={0.0001}
                onChange={minimum => onChange({minimum})}
            />
            <span className={style.label}>Input maximum expected value:</span>
            <NumberInput
                defaultValue={parameter.maximum}
                step={0.0001}
                onChange={maximum => onChange({maximum})}
            />
        </div>
    );
}

export default ParameterSettings;
