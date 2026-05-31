import { type SurveyScaleOption } from "@/domain/definitions";
import { FaIcon } from "@/components/ui/fa-icon";

type SurveyScaleProps = {
  name: string;
  legend: string;
  options: readonly SurveyScaleOption[];
  defaultValue?: number;
  required?: boolean;
  disabled?: boolean;
};

/**
 * 한 문항을 큰 버튼 3개로 답하는 고령자 친화 척도.
 * 큰 아이콘과 글씨, 넓은 터치 영역으로 한 번에 한 가지만 고르게 한다.
 */
export function SurveyScale({
  name,
  legend,
  options,
  defaultValue,
  required = true,
  disabled = false,
}: SurveyScaleProps) {
  return (
    <fieldset className="survey-scale">
      <legend>{legend}</legend>
      <div className="survey-options">
        {options.map((option) => (
          <label className="survey-option" key={option.value}>
            <input
              defaultChecked={defaultValue === option.value}
              disabled={disabled}
              name={name}
              required={required}
              type="radio"
              value={option.value}
            />
            <span aria-hidden="true" className="survey-icon">
              <FaIcon name={option.icon} />
            </span>
            <span className="survey-option-label">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
