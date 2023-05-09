import {useState} from "react";
import NumberInput from "../../common/NumberInput";
import style from "./Generator.module.css";
import ParameterSettings, {
    Parameter,
} from "./ParameterSettings/ParameterSettings";

const defaultParameter = {
    length: 32,
    minimum: 0,
    maximum: 1,
};

function generateCode(parameters: Parameter[], outputBitLength: number) {
    const offsets: {from: number; to: number; param: Parameter}[] = [];
    let curr = 0;
    let totalLength = 0;
    parameters.forEach(param => {
        totalLength = Math.max(totalLength, curr + param.length);
        offsets.push({from: curr, to: curr + param.length, param});
        curr += param.length;
    });
    const converted = parameters
        .map(param => {
            const {minimum, maximum} = param;
            const range = maximum - minimum;
            const sub = minimum != 0.0 ? ` - ${minimum.toFixed(4)}` : "";
            const div = range != 1.0 ? ` / ${range.toFixed(4)}` : "";
            return `    uint ${param.name}Conv = uint(((${
                param.name
            }${sub})${div}) * ${(1n << BigInt(param.length)) - 1n}.0);`;
        })
        .join("\n");

    const outputCount = Math.ceil(totalLength / outputBitLength);
    const outputType = `uint[${outputCount}]`;

    let lines = [];
    for (let i = 0; i < outputCount; i++) {
        let count = 0;
        for (let offset of offsets) {
            if (
                offset.to <= i * outputBitLength ||
                offset.from >= (i + 1) * outputBitLength
            ) {
                continue;
            }

            const shiftAmount = offset.from - i * outputBitLength;
            const shift =
                shiftAmount != 0
                    ? ` ${shiftAmount > 0 ? "<<" : ">>"} ${Math.abs(
                          shiftAmount,
                      )}`
                    : "";
            const rightSide = `${offset.param.name}Conv${shift}`;
            if (count == 0) {
                lines.push(`    encoded[${i}] = ${rightSide};`);
            } else {
                lines.push(`    encoded[${i}] |= ${rightSide};`);
            }
            count++;
        }
    }

    const decodingLines: string[] = [];
    offsets.forEach(({from, to, param}) => {
        let line = `    decoded.${param.name} = `;
        let parts: string[] = [];
        for (let i = 0; i < outputCount; i++) {
            const overlapFrom = Math.max(i * outputBitLength, from);
            const overlapTo = Math.min((i + 1) * outputBitLength, to);
            const startBitIndex = i * outputBitLength - from;

            if (overlapFrom >= overlapTo) {
                continue;
            }

            const shiftAmount = overlapFrom - i * outputBitLength;
            const length = overlapTo - overlapFrom;
            const bitmask = (1n << BigInt(length)) - 1n;
            const shift = shiftAmount != 0 ? ` >> ${shiftAmount}` : "";
            const rightShift = startBitIndex > 0 ? ` << ${startBitIndex}` : "";
            parts.push(
                `(((encoded[${i}]${shift}) & ${bitmask}u)${rightShift})`,
            );
        }

        let bits = parts.join(" | ");
        const {minimum, maximum} = param;
        const range = maximum - minimum;

        const rangeMul = range != 1.0 ? ` * ${range.toFixed(4)}` : "";
        const minAdd = minimum != 0.0 ? ` + ${minimum.toFixed(4)}` : "";
        decodingLines.push(
            `${line}float(${bits}) / ${
                (1n << BigInt(param.length)) - 1n
            }.0${rangeMul}${minAdd};`,
        );
    });

    const code = `// Generated code
${outputType} encode(${parameters.map(p => "float " + p.name).join(", ")}) {
${converted}
    ${outputType} encoded;
${lines.join("\n")}
    return encoded;
}

struct Values {
${parameters.map(p => `    float ${p.name};`).join("\n")}
};

Values decode(${outputType} encoded) {
    Values decoded;
${decodingLines.join("\n")}
    return decoded;
}`;
    console.log(code);
}

function Generator() {
    const [parameters, setParameters] = useState([
        {...defaultParameter, id: 0, name: "parameter0"},
    ]);
    
    const [lastId, setLastId] = useState(1);

    const [outputBitLength, setOutputBitLength] = useState(32);

    return (
        <div className={style.content}>
            {parameters.map((parameter, i) => (
                <ParameterSettings
                    key={parameter.id}
                    id={i}
                    parameter={parameter}
                    onChange={changed =>
                        setParameters(params =>
                            params.map(p =>
                                p.id === parameter.id ? {...p, ...changed} : p,
                            ),
                        )
                    }
                    canDelete={parameters.length > 1}
                    onDelete={() =>
                        setParameters(params =>
                            params.filter(p => p.id != parameter.id),
                        )
                    }
                />
            ))}
            <button
                className={style.button}
                onClick={() => {
                    setParameters(params => [
                        ...params,
                        {
                            ...defaultParameter,
                            id: lastId,
                            name: "parameter" + lastId,
                        },
                    ]);
                    setLastId(lastId + 1);
                }}>
                Add new
            </button>
            <div className={style.bitLength}>
                <span className={style.label}>Output bit split interval:</span>
                <NumberInput
                    min={1}
                    max={32}
                    defaultValue={outputBitLength}
                    onChange={setOutputBitLength}
                />
            </div>
            <button
                className={style.button}
                onClick={() => generateCode(parameters, outputBitLength)}>
                Generate
            </button>
        </div>
    );
}

export default Generator;
