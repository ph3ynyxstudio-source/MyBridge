import React, { useState } from "react";
import { UI_TERMS } from "../../../../theme/UI_TERMS";
import "./NewProjectInput.css";

export interface NewProjectInputProps {
  existingProjects: string[];
  onCreateProject: (projectName: string) => Promise<void>;
}

export const NewProjectInput: React.FC<NewProjectInputProps> = ({
  existingProjects,
  onCreateProject,
}) => {
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMsg(UI_TERMS.newProjectInput.emptyError);
      return;
    }

    if (existingProjects.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(`Le projet "${trimmed}" existe déjà.`);
      return;
    }

    setIsCreating(true);
    setErrorMsg(null);

    try {
      await onCreateProject(trimmed);
      setName("");
    } catch (err) {
      setErrorMsg(typeof err === "string" ? err : String(err));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="new-project-input-container">
      <form className="new-project-input__form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="new-project-input__field"
          placeholder={UI_TERMS.newProjectInput.placeholder}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errorMsg) setErrorMsg(null);
          }}
          disabled={isCreating}
        />
        <button
          type="submit"
          className="new-project-input__btn"
          disabled={isCreating || !name.trim()}
        >
          {isCreating
            ? UI_TERMS.newProjectInput.buttonCreating
            : UI_TERMS.newProjectInput.buttonCreate}
        </button>
      </form>

      {errorMsg && (
        <span className="new-project-input__error" role="alert">
          {errorMsg}
        </span>
      )}
    </div>
  );
};
