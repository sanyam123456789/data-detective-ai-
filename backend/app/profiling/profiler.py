import os
import io
import math
import numpy as np
import pandas as pd
from typing import Dict, Any, List
from app.core.exceptions import InvalidFileException

class DatasetProfiler:
    @staticmethod
    def profile(file_content: bytes, filename: str, ext: str) -> Dict[str, Any]:
        """
        Profiles a CSV or Excel dataset to extract global metrics, per-column statistics,
        type inferences, and outlier mappings.
        """
        try:
            if ext == ".csv":
                try:
                    df = pd.read_csv(io.BytesIO(file_content))
                except UnicodeDecodeError:
                    df = pd.read_csv(io.BytesIO(file_content), encoding="latin-1")
            elif ext in [".xls", ".xlsx"]:
                df = pd.read_excel(io.BytesIO(file_content))
            else:
                raise InvalidFileException("Unsupported file extension.")
        except Exception as e:
            raise InvalidFileException(f"Failed to load dataset: {str(e)}")

        if df.empty:
            raise InvalidFileException("The loaded dataset is empty.")

        total_rows = len(df)
        total_columns = len(df.columns)
        column_names = [str(c) for c in df.columns]
        memory_usage_bytes = int(df.memory_usage(deep=True).sum())
        file_size = len(file_content)

        # Duplicate row analysis
        total_duplicate_rows = int(df.duplicated().sum())
        duplicate_percentage = float((total_duplicate_rows / total_rows) * 100) if total_rows > 0 else 0.0

        # Global aggregate stats
        total_missing_values = 0
        total_outliers = 0
        total_invalid_dates = 0
        
        columns_profile = {}
        inferred_types = {}

        # Scan each column
        for col in df.columns:
            col_str = str(col)
            null_count = int(df[col].isnull().sum())
            total_missing_values += null_count
            missing_percentage = float((null_count / total_rows) * 100) if total_rows > 0 else 0.0
            
            clean_series = df[col].dropna()
            unique_count = int(clean_series.nunique())
            duplicate_count = len(df[col]) - unique_count - null_count
            duplicate_count = max(0, duplicate_count)

            col_type = DatasetProfiler._infer_type(df[col])
            inferred_types[col_str] = col_type

            col_stats: Dict[str, Any] = {
                "null_count": null_count,
                "missing_values": null_count,
                "missing_percentage": missing_percentage,
                "unique_values": unique_count,
                "duplicate_values": duplicate_count,
                "inferred_type": col_type
            }

            # Compute type-specific statistics
            if col_type in ["Integer", "Float"]:
                numeric_stats = DatasetProfiler._compute_numeric_stats(clean_series)
                col_stats.update(numeric_stats)
                total_outliers += numeric_stats.get("outlier_count", 0)
                
            elif col_type in ["Category", "Text", "Boolean"]:
                categorical_stats = DatasetProfiler._compute_categorical_stats(df[col], unique_count)
                col_stats.update(categorical_stats)
                
            elif col_type == "Datetime":
                date_stats = DatasetProfiler._compute_date_stats(df[col], null_count)
                col_stats.update(date_stats)
                total_invalid_dates += date_stats.get("invalid_dates", 0)

            columns_profile[col_str] = col_stats

        # Calculate health score breakdown
        health_info = DatasetProfiler._calculate_health_score(
            total_rows=total_rows,
            total_columns=total_columns,
            total_missing_values=total_missing_values,
            total_duplicate_rows=total_duplicate_rows,
            total_outliers=total_outliers,
            total_invalid_dates=total_invalid_dates,
            num_numeric_cols=sum(1 for t in inferred_types.values() if t in ["Integer", "Float"])
        )

        return {
            "total_rows": total_rows,
            "total_columns": total_columns,
            "column_names": column_names,
            "detected_data_types": inferred_types,
            "memory_usage_bytes": memory_usage_bytes,
            "file_size_bytes": file_size,
            "total_duplicate_rows": total_duplicate_rows,
            "duplicate_percentage": duplicate_percentage,
            "total_missing_values": total_missing_values,
            "total_outliers": total_outliers,
            "total_invalid_dates": total_invalid_dates,
            "health_score": health_info["score"],
            "health_breakdown": health_info["breakdown"],
            "columns": columns_profile
        }

    @staticmethod
    def _infer_type(series: pd.Series) -> str:
        """
        Infers column data type based on series values and pandas metadata.
        """
        if pd.api.types.is_bool_dtype(series):
            return "Boolean"
            
        non_null = series.dropna()
        if len(non_null) > 0:
            # String boolean check
            unique_vals = set(non_null.astype(str).str.lower().unique())
            if unique_vals.issubset({"true", "false", "yes", "no", "y", "n", "t", "f", "1", "0"}):
                return "Boolean"
            
            # Datetime check
            try:
                parsed = pd.to_datetime(non_null, errors='coerce')
                parsed_ratio = parsed.notnull().sum() / len(non_null)
                is_string_dt = False
                if pd.api.types.is_object_dtype(series):
                    sample_str = str(non_null.iloc[0])
                    if any(char in sample_str for char in ["-", "/", ":"]):
                        is_string_dt = True
                
                if parsed_ratio > 0.85 and (pd.api.types.is_datetime64_any_dtype(series) or is_string_dt):
                    return "Datetime"
            except Exception:
                pass

        if pd.api.types.is_numeric_dtype(series):
            if pd.api.types.is_integer_dtype(series):
                return "Integer"
            if np.all(np.mod(non_null, 1) == 0):
                return "Integer"
            return "Float"

        # Categorical vs Text distinction
        unique_count = series.nunique()
        if unique_count > 0:
            if unique_count <= 25 or (unique_count / len(series) < 0.08):
                return "Category"
        return "Text"

    @staticmethod
    def _compute_numeric_stats(series: pd.Series) -> Dict[str, Any]:
        """
        Computes numeric averages, variance, and IQR outliers.
        """
        s_float = series.astype(float)
        
        q1 = float(s_float.quantile(0.25)) if len(s_float) > 0 else 0.0
        q3 = float(s_float.quantile(0.75)) if len(s_float) > 0 else 0.0
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        
        outliers = s_float[(s_float < lower_bound) | (s_float > upper_bound)]
        outlier_count = int(len(outliers))
        
        mean_val = float(s_float.mean()) if not math.isnan(s_float.mean()) else 0.0
        median_val = float(s_float.median()) if not math.isnan(s_float.median()) else 0.0
        
        mode_series = s_float.mode()
        mode_val = float(mode_series.iloc[0]) if not mode_series.empty and not math.isnan(mode_series.iloc[0]) else 0.0
        
        min_val = float(s_float.min()) if not math.isnan(s_float.min()) else 0.0
        max_val = float(s_float.max()) if not math.isnan(s_float.max()) else 0.0
        std_val = float(s_float.std()) if not math.isnan(s_float.std()) else 0.0
        var_val = float(s_float.var()) if not math.isnan(s_float.var()) else 0.0
        
        return {
            "mean": mean_val,
            "median": median_val,
            "mode": mode_val,
            "min": min_val,
            "max": max_val,
            "std_dev": std_val,
            "variance": var_val,
            "q1": q1,
            "q3": q3,
            "iqr": iqr,
            "lower_bound": lower_bound,
            "upper_bound": upper_bound,
            "outlier_count": outlier_count
        }

    @staticmethod
    def _compute_categorical_stats(series: pd.Series, cardinality: int) -> Dict[str, Any]:
        """
        Computes string value occurrences and top category distributions.
        """
        clean = series.dropna().astype(str)
        top_cats = clean.value_counts().head(10)
        frequencies = [{"value": str(k), "count": int(v)} for k, v in top_cats.items()]
        
        top_category = frequencies[0]["value"] if len(frequencies) > 0 else None
        top_frequency = frequencies[0]["count"] if len(frequencies) > 0 else 0
        
        return {
            "cardinality": cardinality,
            "top_categories": frequencies,
            "top_category": top_category,
            "top_frequency": top_frequency
        }

    @staticmethod
    def _compute_date_stats(series: pd.Series, base_nulls: int) -> Dict[str, Any]:
        """
        Identifies date boundaries and format mismatch occurrences.
        """
        parsed = pd.to_datetime(series, errors='coerce')
        valid_dates = parsed.dropna()
        
        min_date = valid_dates.min().isoformat() if not valid_dates.empty else None
        max_date = valid_dates.max().isoformat() if not valid_dates.empty else None
        
        invalid_dates_count = int(series.notnull().sum() - valid_dates.size)
        invalid_dates_count = max(0, invalid_dates_count)
        
        return {
            "min_date": min_date,
            "max_date": max_date,
            "invalid_dates": invalid_dates_count
        }

    @staticmethod
    def _calculate_health_score(
        total_rows: int,
        total_columns: int,
        total_missing_values: int,
        total_duplicate_rows: int,
        total_outliers: int,
        total_invalid_dates: int,
        num_numeric_cols: int
    ) -> Dict[str, Any]:
        """
        Returns dynamic health grade calculated using deductions.
        """
        score = 100.0
        breakdown = []
        total_cells = total_rows * total_columns
        
        # 1. Missing cell ratio deductions
        if total_cells > 0:
            missing_ratio = total_missing_values / total_cells
            missing_deduction = round(missing_ratio * 30, 2)
            if missing_deduction > 0:
                score -= missing_deduction
                breakdown.append(f"Deducted {missing_deduction} points for {total_missing_values} missing values ({round(missing_ratio*100, 2)}% cell emptiness).")
        
        # 2. Duplicate rows deductions
        if total_rows > 0:
            duplicate_ratio = total_duplicate_rows / total_rows
            duplicate_deduction = round(duplicate_ratio * 20, 2)
            if duplicate_deduction > 0:
                score -= duplicate_deduction
                breakdown.append(f"Deducted {duplicate_deduction} points for {total_duplicate_rows} duplicate rows ({round(duplicate_ratio*100, 2)}%).")

        # 3. IQR Outlier deductions
        total_numeric_cells = total_rows * num_numeric_cols
        if total_numeric_cells > 0:
            outlier_ratio = total_outliers / total_numeric_cells
            outlier_deduction = round(outlier_ratio * 30, 2)
            if outlier_deduction > 0:
                score -= outlier_deduction
                breakdown.append(f"Deducted {outlier_deduction} points for {total_outliers} outliers in numeric columns ({round(outlier_ratio*100, 2)}% outlier density).")

        # 4. Invalid date parses deductions
        if total_rows > 0 and total_invalid_dates > 0:
            invalid_ratio = total_invalid_dates / total_rows
            invalid_deduction = round(invalid_ratio * 20, 2)
            if invalid_deduction > 0:
                score -= invalid_deduction
                breakdown.append(f"Deducted {invalid_deduction} points for {total_invalid_dates} invalid date records.")

        final_score = max(0, min(100, int(round(score))))
        if not breakdown:
            breakdown.append("Perfect dataset health score! No outliers, missing values, or duplicate records identified.")

        return {
            "score": final_score,
            "breakdown": breakdown
        }
