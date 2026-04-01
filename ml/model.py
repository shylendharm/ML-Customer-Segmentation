import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import os

# Get script directory and backend directory
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(script_dir, "..", "backend")
dataset_path = os.path.join(backend_dir, "..", "dataset", "Mall_Customers.csv")
output_path = os.path.join(backend_dir, "data.json")

# Load dataset
df = pd.read_csv(dataset_path)

# Select features
X = df[['Annual Income (k$)', 'Spending Score (1-100)']]

# Find best k using silhouette
best_k = 2
best_score = -1

for k in range(2, 10):
    kmeans = KMeans(n_clusters=k, random_state=42)
    labels = kmeans.fit_predict(X)
    score = silhouette_score(X, labels)

    if score > best_score:
        best_k = k
        best_score = score

# Final model
kmeans = KMeans(n_clusters=best_k, random_state=42)
df['Cluster'] = kmeans.fit_predict(X)

# Save result
df.to_json(output_path, orient='records')

print("Clustering done")