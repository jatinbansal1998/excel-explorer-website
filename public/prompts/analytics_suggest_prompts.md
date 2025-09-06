Dataset context:

```
{{CONTEXT}}
```

Task:

- Propose 8-15 highly relevant follow-up prompts to analyze the dataset
- Categorize each as one of: descriptive, diagnostic, predictive, prescriptive (or other)
- Provide a short rationale for each

Output:

- Return JSON adhering to the schema above
- Place prompts in `followUps` array and leave `insights` empty
