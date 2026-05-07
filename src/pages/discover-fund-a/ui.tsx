import React from "react";
import { useNavigate } from "react-router-dom";
import { useDiscoverFundALogic } from "./logic";
import HushhTechBackHeader from "../../components/hushh-tech-back-header/HushhTechBackHeader";
import HushhTechCta, {
  HushhTechCtaVariant,
} from "../../components/hushh-tech-cta/HushhTechCta";
import HushhTechFooter, {
  HushhFooterTab,
} from "../../components/hushh-tech-footer/HushhTechFooter";

const FieldRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="group flex items-center justify-between gap-4 border-b border-gray-200 py-4 hover:bg-gray-50/50 transition-colors -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
    <span className="text-sm text-gray-500 font-light">{label}</span>
    <div className="flex items-center gap-2 text-right">{children}</div>
  </div>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium mb-2">
    {children}
  </p>
);

const FeatureCard = ({
  icon,
  title,
  description,
  iconColor = "text-gray-700",
}: {
  icon: string;
  title: string;
  description: string;
  iconColor?: string;
}) => (
  <div className="h-full flex items-start gap-4 border border-gray-200 rounded-2xl p-5 hover:border-gray-300 hover:bg-gray-50/50 transition-all">
    <div className="w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center shrink-0 bg-white">
      <span className={`material-symbols-outlined ${iconColor} !text-[1.15rem]`}>
        {icon}
      </span>
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-[13px] font-semibold text-black leading-snug mb-1">
        {title}
      </h3>
      <p className="text-[11px] text-gray-400 font-light leading-relaxed">
        {description}
      </p>
    </div>
  </div>
);

const PHILOSOPHY_ICONS: Record<string, string> = {
  "Options Intelligence": "psychology",
  "AI-Enhanced Research": "neurology",
  "Risk-First Architecture": "shield",
  "Concentrated Conviction": "target",
};

const PHILOSOPHY_COLORS: Record<string, string> = {
  "Options Intelligence": "text-hushh-blue",
  "AI-Enhanced Research": "text-hushh-blue",
  "Risk-First Architecture": "text-ios-green",
  "Concentrated Conviction": "text-ios-dark",
};

const EDGE_ICONS: Record<string, string> = {
  "Volatility Harvesting": "trending_up",
  "Asymmetric Returns": "rocket_launch",
  "Income Generation": "payments",
  "Downside Protection": "security",
};

const EDGE_COLORS: Record<string, string> = {
  "Volatility Harvesting": "text-hushh-blue",
  "Asymmetric Returns": "text-hushh-blue",
  "Income Generation": "text-ios-green",
  "Downside Protection": "text-ios-green",
};

const ASSET_ICONS: Record<string, string> = {
  "U.S. Large-Cap Equities": "account_balance",
  "Strategic Options Overlay": "tune",
  "Cash & Equivalents": "savings",
};

const ASSET_COLORS: Record<string, string> = {
  "U.S. Large-Cap Equities": "text-hushh-blue",
  "Strategic Options Overlay": "text-ios-yellow",
  "Cash & Equivalents": "text-ios-green",
};

const RISK_ICONS: Record<string, string> = {
  "Position Limits": "pie_chart",
  "Hedging Framework": "shield",
  "Drawdown Protocols": "trending_down",
  "Liquidity Management": "water_drop",
};

const RISK_COLORS: Record<string, string> = {
  "Position Limits": "text-ios-yellow",
  "Hedging Framework": "text-ios-green",
  "Drawdown Protocols": "text-ios-red",
  "Liquidity Management": "text-hushh-blue",
};

const FundA = () => {
  const navigate = useNavigate();
  const {
    heroTitle,
    heroSubtitle,
    heroDescription,
    targetIRRLabel,
    targetIRRValue,
    targetIRRPeriod,
    targetIRRDisclaimer,
    philosophySectionTitle,
    philosophyCards,
    sellTheWallHref,
    edgeCards,
    assetFocusSectionTitle,
    assetFocusDescription,
    assetPillars,
    alphaStackSectionTitle,
    alphaStackSubtitle,
    alphaStackRows,
    riskSectionTitle,
    riskCards,
    keyTermsSectionTitle,
    keyTermsSubtitle,
    keyTerms,
    shareClasses,
    joinSectionTitle,
    joinSectionDescription,
    joinButtonLabel,
    handleCompleteProfile,
  } = useDiscoverFundALogic();

  return (
    <div className="bg-white text-gray-900 min-h-screen antialiased flex flex-col selection:bg-hushh-blue selection:text-white">
      <HushhTechBackHeader
        onBackClick={() => navigate("/")}
        rightType="hamburger"
      />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-grow pb-32 lg:pb-12">
        <div className="flex flex-col gap-10 pt-6 lg:gap-14">
          <section className="lg:grid lg:grid-cols-12 lg:gap-10 lg:items-stretch">
            <div className="pb-8 lg:col-span-7 xl:col-span-8 lg:pb-0 lg:pt-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-hushh-blue/20 rounded-full mb-6">
                <span className="w-1.5 h-1.5 bg-hushh-blue rounded-full" />
                <span className="text-[10px] tracking-[0.15em] uppercase font-medium text-hushh-blue">
                  Flagship Fund
                </span>
              </div>

              <h1
                className="text-[2.75rem] leading-[1.1] font-normal text-black tracking-tight sm:text-[3.25rem] lg:text-[4rem]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {heroTitle} <br />
                <span className="text-gray-400 italic font-light">
                  {heroSubtitle}
                </span>
              </h1>

              <p className="text-[13px] text-gray-400 font-light mt-4 leading-relaxed max-w-xs sm:max-w-md lg:max-w-xl sm:text-sm">
                {heroDescription}
              </p>
            </div>

            <div className="lg:col-span-5 xl:col-span-4">
              <div className="bg-ios-dark rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden h-full flex items-center justify-center">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-hushh-blue/15 rounded-full blur-2xl" />
                <div className="relative z-10">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-3 font-medium">
                    {targetIRRLabel}
                  </p>
                  <p
                    className="text-[48px] leading-none font-medium text-ios-green mb-2 sm:text-[56px]"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {targetIRRValue}
                  </p>
                  <p className="text-[13px] text-gray-400 mb-4">
                    {targetIRRPeriod}
                  </p>
                  <p className="text-[9px] text-gray-600 italic max-w-[220px] sm:max-w-[260px] mx-auto leading-relaxed">
                    {targetIRRDisclaimer}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-10 xl:grid-cols-2 xl:gap-12">
            <div>
              <SectionLabel>{philosophySectionTitle}</SectionLabel>
              <div className="grid gap-3 sm:grid-cols-2">
                {philosophyCards.map((card) => (
                  <FeatureCard
                    key={card.title}
                    icon={PHILOSOPHY_ICONS[card.title] || "lightbulb"}
                    iconColor={PHILOSOPHY_COLORS[card.title] || "text-hushh-blue"}
                    title={card.title}
                    description={card.description}
                  />
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>
                Our Edge -{" "}
                <a
                  href={sellTheWallHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-hushh-blue underline decoration-hushh-blue/30 hover:decoration-hushh-blue transition-colors"
                >
                  Sell the Wall
                </a>{" "}
                Framework
              </SectionLabel>
              <div className="grid gap-3 sm:grid-cols-2">
                {edgeCards.map((card) => (
                  <FeatureCard
                    key={card.title}
                    icon={EDGE_ICONS[card.title] || "auto_awesome"}
                    iconColor={EDGE_COLORS[card.title] || "text-hushh-blue"}
                    title={card.title}
                    description={card.description}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-10 xl:grid-cols-12 xl:gap-12">
            <div className="xl:col-span-5">
              <SectionLabel>{assetFocusSectionTitle}</SectionLabel>
              <p className="text-[11px] text-gray-400 font-light leading-relaxed mb-4 lg:max-w-md">
                {assetFocusDescription}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {assetPillars.map((pillar) => (
                  <FeatureCard
                    key={pillar.title}
                    icon={ASSET_ICONS[pillar.title] || "category"}
                    iconColor={ASSET_COLORS[pillar.title] || "text-hushh-blue"}
                    title={pillar.title}
                    description={pillar.description}
                  />
                ))}
              </div>
            </div>

            <div className="xl:col-span-7">
              <SectionLabel>{alphaStackSectionTitle}</SectionLabel>
              <p className="text-[10px] text-gray-400 italic mb-1">
                {alphaStackSubtitle}
              </p>
              <div>
                {alphaStackRows.map((row) =>
                  row.isTotalRow ? (
                    <div
                      key={row.label}
                      className="flex items-center justify-between bg-ios-dark text-white rounded-2xl px-6 py-4 mt-3"
                    >
                      <span className="text-sm font-semibold">
                        {row.label}
                      </span>
                      <span
                        className="text-xl font-medium text-ios-green"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {row.value}
                      </span>
                    </div>
                  ) : (
                    <FieldRow key={row.label} label={row.label}>
                      <span className="text-sm font-semibold text-black">
                        {row.value}
                      </span>
                    </FieldRow>
                  )
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-10 xl:grid-cols-12 xl:gap-12">
            <div className="xl:col-span-5">
              <SectionLabel>{riskSectionTitle}</SectionLabel>
              <div className="grid gap-3 sm:grid-cols-2">
                {riskCards.map((card) => (
                  <FeatureCard
                    key={card.title}
                    icon={RISK_ICONS[card.title] || "security"}
                    iconColor={RISK_COLORS[card.title] || "text-ios-green"}
                    title={card.title}
                    description={card.description}
                  />
                ))}
              </div>
            </div>

            <div className="xl:col-span-7">
              <SectionLabel>{keyTermsSectionTitle}</SectionLabel>
              <p className="text-[10px] text-gray-400 italic mb-1">
                {keyTermsSubtitle}
              </p>

              <div className="mb-6">
                {keyTerms.slice(0, 2).map((term) => (
                  <FieldRow key={term.title} label={term.title}>
                    <span className="text-[12px] font-medium text-black max-w-[180px] sm:max-w-[260px] lg:max-w-[320px] text-right leading-snug">
                      {term.content}
                    </span>
                  </FieldRow>
                ))}
              </div>

              <SectionLabel>Share Classes</SectionLabel>
              <div className="grid gap-3 mb-6 md:grid-cols-2">
                {shareClasses.map((sc) => (
                  <div
                    key={sc.shareClass}
                    className="border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-ios-dark flex items-center justify-center">
                          <span className="material-symbols-outlined text-white !text-[0.9rem]">
                            account_balance_wallet
                          </span>
                        </div>
                        <span className="text-[13px] font-semibold text-black">
                          {sc.shareClass}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-hushh-blue bg-hushh-blue/10 px-2.5 py-1 rounded-full">
                        Min {sc.minInvestment}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-0.5">
                          Mgmt
                        </p>
                        <p className="text-[12px] font-semibold text-black">
                          {sc.managementFee}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-0.5">
                          Perf
                        </p>
                        <p className="text-[12px] font-semibold text-black">
                          {sc.performanceFee}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-0.5">
                          Hurdle
                        </p>
                        <p className="text-[12px] font-semibold text-black">
                          {sc.hurdleRate}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                {keyTerms.slice(2).map((term) => (
                  <FieldRow key={term.title} label={term.title}>
                    <span className="text-[12px] font-medium text-black max-w-[180px] sm:max-w-[260px] lg:max-w-[320px] text-right leading-snug">
                      {term.content}
                    </span>
                  </FieldRow>
                ))}
              </div>
            </div>
          </section>

          <section className="border-t border-gray-200 pt-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="lg:max-w-xl">
                <h2
                  className="text-[22px] font-medium text-black tracking-tight mb-2 sm:text-[28px]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {joinSectionTitle}
                </h2>
                <p className="text-[13px] text-gray-400 font-light leading-relaxed max-w-xs sm:max-w-md">
                  {joinSectionDescription}
                </p>
              </div>

              <div className="space-y-3 lg:w-full lg:max-w-sm">
                <HushhTechCta
                  variant={HushhTechCtaVariant.BLACK}
                  onClick={handleCompleteProfile}
                >
                  {joinButtonLabel}
                  <span className="material-symbols-outlined !text-[1.1rem]">
                    arrow_forward
                  </span>
                </HushhTechCta>
                <HushhTechCta
                  variant={HushhTechCtaVariant.WHITE}
                  onClick={() => navigate("/")}
                >
                  Back to Home
                </HushhTechCta>
              </div>
            </div>
          </section>

          <p
            className="text-[9px] text-gray-400 text-center leading-relaxed italic max-w-xs sm:max-w-lg lg:max-w-3xl mx-auto pb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Investing involves risk, including possible loss of principal. Past
            performance does not guarantee future results. Hushh Technologies is an
            SEC registered investment advisor.
          </p>
        </div>
      </main>

      <div className="lg:hidden">
        <HushhTechFooter activeTab={HushhFooterTab.FUND_A} />
      </div>
    </div>
  );
};

export default FundA;
