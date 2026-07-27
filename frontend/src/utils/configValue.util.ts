import Config from "../types/config.type";
import { Timespan } from "../types/timespan.type";

const parseTimespan = (value: string): Timespan => {
  const [rawValue, unit] = value.split(" ");
  return {
    value: parseInt(rawValue),
    unit,
  } as Timespan;
};

export const getConfigValue = (
  key: string,
  configVariables: Config[],
  returnDefault: boolean = false,
): any => {
  if (!configVariables) return null;

  const configVariable = configVariables.filter(
    (variable) => variable.key == key,
  )[0];

  if (!configVariable) throw new Error(`Config variable ${key} not found`);

  const value = returnDefault
    ? configVariable.defaultValue
    : (configVariable.value ?? configVariable.defaultValue);

  if (configVariable.type == "number" || configVariable.type == "filesize")
    return parseInt(value);
  if (configVariable.type == "boolean") return value == "true";
  if (configVariable.type == "string" || configVariable.type == "text")
    return value;
  if (configVariable.type == "timespan") return parseTimespan(value);
};
