import { cn } from "@/lib/utils";
import { BLOOD_GROUP_LABELS, BLOOD_GROUPS } from "@/lib/constants";
import type { BloodGroup } from "@/types";

/* ----------------------------------------------------------------------
   BloodCompatibilityChart
   ----------------------------------------------------------------------
   Static reference chart that shows which donor blood groups are
   compatible with which recipient blood groups.

   Rows = donor blood, columns = recipient blood.
   A red cell means: a donor with that row group can give blood to a
   recipient with that column group.

   Hovering or focusing a compatible cell reveals a tooltip describing
   the relationship; non-compatible cells are visually muted.
   ---------------------------------------------------------------------- */

type Compatibility = Record<BloodGroup, Record<BloodGroup, boolean>>;

/**
 * Reference matrix sourced from the standard ABO + Rh compatibility table.
 */
const COMPATIBILITY: Compatibility = {
  O_NEGATIVE: {
    O_NEGATIVE: true,
    O_POSITIVE: true,
    A_NEGATIVE: true,
    A_POSITIVE: true,
    B_NEGATIVE: true,
    B_POSITIVE: true,
    AB_NEGATIVE: true,
    AB_POSITIVE: true,
  },
  O_POSITIVE: {
    O_NEGATIVE: false,
    O_POSITIVE: true,
    A_NEGATIVE: false,
    A_POSITIVE: true,
    B_NEGATIVE: false,
    B_POSITIVE: true,
    AB_NEGATIVE: false,
    AB_POSITIVE: true,
  },
  A_NEGATIVE: {
    O_NEGATIVE: false,
    O_POSITIVE: false,
    A_NEGATIVE: true,
    A_POSITIVE: true,
    B_NEGATIVE: false,
    B_POSITIVE: false,
    AB_NEGATIVE: true,
    AB_POSITIVE: true,
  },
  A_POSITIVE: {
    O_NEGATIVE: false,
    O_POSITIVE: false,
    A_NEGATIVE: false,
    A_POSITIVE: true,
    B_NEGATIVE: false,
    B_POSITIVE: false,
    AB_NEGATIVE: false,
    AB_POSITIVE: true,
  },
  B_NEGATIVE: {
    O_NEGATIVE: false,
    O_POSITIVE: false,
    A_NEGATIVE: false,
    A_POSITIVE: false,
    B_NEGATIVE: true,
    B_POSITIVE: true,
    AB_NEGATIVE: true,
    AB_POSITIVE: true,
  },
  B_POSITIVE: {
    O_NEGATIVE: false,
    O_POSITIVE: false,
    A_NEGATIVE: false,
    A_POSITIVE: false,
    B_NEGATIVE: false,
    B_POSITIVE: true,
    AB_NEGATIVE: false,
    AB_POSITIVE: true,
  },
  AB_NEGATIVE: {
    O_NEGATIVE: false,
    O_POSITIVE: false,
    A_NEGATIVE: false,
    A_POSITIVE: false,
    B_NEGATIVE: false,
    B_POSITIVE: false,
    AB_NEGATIVE: true,
    AB_POSITIVE: true,
  },
  AB_POSITIVE: {
    O_NEGATIVE: false,
    O_POSITIVE: false,
    A_NEGATIVE: false,
    A_POSITIVE: false,
    B_NEGATIVE: false,
    B_POSITIVE: false,
    AB_NEGATIVE: false,
    AB_POSITIVE: true,
  },
};

export interface BloodCompatibilityChartProps {
  className?: string;
}

export function BloodCompatibilityChart({ className }: BloodCompatibilityChartProps) {
  return (
    <figure className={cn("w-full", className)}>
      <figcaption className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Blood compatibility chart
        </h3>
        <p className="text-sm text-muted-foreground">
          Rows are donor groups; columns are recipient groups. A filled cell
          means the donor can give blood to that recipient.
        </p>
      </figcaption>

      <div className="overflow-x-auto">
        <table
          role="grid"
          aria-label="Blood type compatibility matrix"
          className="w-full min-w-[640px] border-separate border-spacing-1"
        >
          <thead>
            <tr>
              <th scope="col" className="w-24 px-2 py-2 text-left text-xs font-semibold text-muted-foreground">
                <span className="sr-only">Donor / Recipient</span>
                <span aria-hidden>Donor ↓ &nbsp; Recipient →</span>
              </th>
              {BLOOD_GROUPS.map((group) => (
                <th
                  key={group}
                  scope="col"
                  className="px-2 py-2 text-center text-xs font-semibold text-foreground"
                >
                  {BLOOD_GROUP_LABELS[group]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BLOOD_GROUPS.map((donor) => (
              <tr key={donor}>
                <th
                  scope="row"
                  className="px-2 py-2 text-left text-xs font-semibold text-foreground"
                >
                  {BLOOD_GROUP_LABELS[donor]}
                </th>
                {BLOOD_GROUPS.map((recipient) => {
                  const compatible = COMPATIBILITY[donor][recipient];
                  return (
                    <td key={recipient} className="p-0">
                      <div
                        role="gridcell"
                        tabIndex={compatible ? 0 : -1}
                        aria-label={ariaLabelFor(donor, recipient, compatible)}
                        title={ariaLabelFor(donor, recipient, compatible)}
                        className={cn(
                          "flex h-9 items-center justify-center rounded-md text-xs font-medium transition-colors",
                          compatible
                            ? "bg-primary text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                            : "bg-muted/60 text-muted-foreground",
                        )}
                      >
                        {compatible ? "✓" : "—"}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <li className="inline-flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-3 w-3 rounded-sm bg-primary" />
          Compatible
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-3 w-3 rounded-sm bg-muted" />
          Not compatible
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span aria-hidden>O− is the universal donor</span>
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span aria-hidden>AB+ is the universal recipient</span>
        </li>
      </ul>
    </figure>
  );
}

function ariaLabelFor(
  donor: BloodGroup,
  recipient: BloodGroup,
  compatible: boolean,
): string {
  return compatible
    ? `${BLOOD_GROUP_LABELS[donor]} donors can give to ${BLOOD_GROUP_LABELS[recipient]} recipients`
    : `${BLOOD_GROUP_LABELS[donor]} donors cannot give to ${BLOOD_GROUP_LABELS[recipient]} recipients`;
}
