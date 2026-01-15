"use client";

import { Controller, Control } from "react-hook-form";
import styles from "./InputStyles.module.css";

type Props = {
  name: string;
  control: Control<any>;
  label?: string;
  placeholder?: string;
  rows?: number;
  rules?: any;
  defaultValue?: string;
};

const CustomTextArea = ({
  name,
  control,
  label,
  placeholder,
  rows = 5,
  rules,
  defaultValue = "",
}: Props) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      defaultValue={defaultValue}
      render={({ field, fieldState: { error } }) => (
        <div className={styles["custom-input-container"]}>
          {label && (
            <p className={styles["custom-input-label"]}>{label}</p>
          )}

          <textarea
            {...field}
            rows={rows}
            placeholder={placeholder}
            className={`${styles["custom-text-area-input"]} ${
              error ? styles["custom-error-input"] : ""
            }`}
          />

          {error && (
            <p className={styles["custom-error-message"]}>
              {error.message}
            </p>
          )}
        </div>
      )}
    />
  );
};

export default CustomTextArea;
