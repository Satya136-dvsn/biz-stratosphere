import mlflow
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# Example MLflow experiment
mlflow.set_experiment("sample-classifier")

def run_experiment():
    # Dummy data
    df = pd.DataFrame({
        'feature1': [1, 2, 3, 4, 5, 6],
        'feature2': [0, 1, 0, 1, 0, 1],
        'target':    [0, 1, 0, 1, 0, 1]
    })
    X = df[['feature1', 'feature2']]
    y = df['target']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    with mlflow.start_run():
        clf = RandomForestClassifier()
        clf.fit(X_train, y_train)
        preds = clf.predict(X_test)
        acc = accuracy_score(y_test, preds)
        mlflow.log_metric("accuracy", acc)
        mlflow.sklearn.log_model(clf, "model")
        print(f"Logged model with accuracy: {acc}")

if __name__ == "__main__":
    run_experiment()
