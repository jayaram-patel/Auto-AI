import sys
import json
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Union
import traceback


class ModelInference:

    def __init__(self, model_path: str):

        self.model_path = Path(model_path)
        self.model = None
        self.feature_names = None
        self.model_metadata = {}

    def load_model(self) -> bool:

        try:
            if not self.model_path.exists():
                raise FileNotFoundError(f"Model file not found: {self.model_path}")

            self.model = joblib.load(self.model_path)

            if hasattr(self.model, "feature_names_in_"):
                self.feature_names = list(self.model.feature_names_in_)

            return True

        except Exception as e:
            print(f"Error loading model: {str(e)}", file=sys.stderr)
            return False

    def validate_input(self, input_data: Dict[str, Any]) -> bool:

        if not input_data:
            return False

        if self.feature_names:
            missing_features = set(self.feature_names) - set(input_data.keys())
            if missing_features:
                print(f"Missing required features: {missing_features}", file=sys.stderr)
                return False

        return True

    def preprocess_input(self, input_data: Dict[str, Any]) -> pd.DataFrame:

        df = pd.DataFrame([input_data])

        if self.feature_names:

            df = df.reindex(columns=self.feature_names, fill_value=0)

        return df

    def predict(self, input_data: Dict[str, Any]) -> Dict[str, Any]:

        try:
            if self.model is None:
                raise ValueError("Model not loaded. Call load_model() first.")

            if not self.validate_input(input_data):
                raise ValueError("Invalid input data")

            df = self.preprocess_input(input_data)

            prediction = self.model.predict(df)

            probabilities = None
            confidence = None

            if hasattr(self.model, "predict_proba"):
                try:
                    proba = self.model.predict_proba(df)
                    probabilities = proba[0].tolist()
                    confidence = float(np.max(proba[0]))
                except:
                    pass

            result = {
                "prediction": (
                    prediction[0].item()
                    if hasattr(prediction[0], "item")
                    else prediction[0]
                ),
                "confidence": confidence,
                "probabilities": probabilities,
                "input_features": input_data,
                "model_path": str(self.model_path),
            }

            return result

        except Exception as e:
            error_msg = f"Prediction error: {str(e)}"
            print(error_msg, file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            raise RuntimeError(error_msg)


def main():

    if len(sys.argv) != 3:
        print(
            "Usage: python inference.py <model_path> <input_json_or_file>",
            file=sys.stderr,
        )
        sys.exit(1)

    model_path = sys.argv[1]
    input_arg = sys.argv[2]

    try:

        from pathlib import Path

        input_path = Path(input_arg)

        if input_path.exists() and input_path.is_file():

            with open(input_path, "r", encoding="utf-8") as f:
                input_data = json.load(f)
        else:

            input_data = json.loads(input_arg)

        inference = ModelInference(model_path)

        if not inference.load_model():
            sys.exit(1)

        result = inference.predict(input_data)

        print(json.dumps(result))

    except json.JSONDecodeError as e:
        print(f"Invalid JSON input: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
