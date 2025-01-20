"use client";

import React from "react";
import styles from "./WeatherWidget.module.css";

interface WeatherWidgetProps {
  label: string;
  value: string | number;
  onRefresh: () => void;
  refreshing: boolean;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  label,
  value,
  onRefresh,
  refreshing,
}) => {
  return (
    <div className={styles.container}>
      <h3 className={styles.label}>{label}</h3>
      <p className={styles.value}>{value}</p>
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className={styles.button}
        aria-busy={refreshing}
      >
        {refreshing ? (
          <>
            <span className={styles.spinner}></span>
          </>
        ) : (
          "Refresh"
        )}
      </button>
    </div>
  );
};

export default WeatherWidget;
