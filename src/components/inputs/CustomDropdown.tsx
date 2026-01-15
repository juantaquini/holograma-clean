"use client";

import { Controller, Control } from "react-hook-form";
import { useState } from "react";
import styles from "./InputStyles.module.css";
import { RiArrowDownSLine } from "react-icons/ri";

type Option = {
  label: string;
  value: string;
};

type Props = {
  name: string;
  control: Control<any>;
  options: Option[];
  label?: string;
  rules?: any;
};

const CustomDropdown = ({ name, control, options, rules, label }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => {
        const selected = options.find(o => o.value === field.value);

        return (
          <div className={styles["custom-dropdown"]}>
            {label && (
              <p className={styles["custom-input-label"]}>{label}</p>
            )}

            <div
              className={`${styles["custom-dropdown-header"]} ${
                error ? styles["custom-error-input"] : ""
              }`}
              onClick={() => setIsOpen(o => !o)}
            >
              {selected?.label || "Select an option"}
              <RiArrowDownSLine />
            </div>

            {isOpen && (
              <div className={styles["custom-dropdown-options"]}>
                {options.map(option => (
                  <div
                    key={option.value}
                    className={styles["custom-dropdown-option"]}
                    onClick={() => {
                      field.onChange(option.value);
                      setIsOpen(false);
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}

            {error && (
              <p className={styles["custom-error-message"]}>
                {error.message}
              </p>
            )}
          </div>
        );
      }}
    />
  );
};

export default CustomDropdown;
