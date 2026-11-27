"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, LifeBuoy } from "lucide-react";
import { apiClient } from "@/lib/api/api-client";
import { useI18n } from "@/lib/i18n/i18n-context";
import type { Locale } from "@/lib/i18n/dictionaries";

type QA = { q: string; a: string };
type Topic = { title: string; items: QA[] };

/** Help content per language. Kinyarwanda / French fall back to English where not written yet. */
const TOPICS: Record<Locale, Topic[]> = {
  en: [
    {
      title: "Saving and paying",
      items: [
        { q: "How do I pay my contribution?", a: "Open Deposits, choose your group and pay by MTN MoMo (you approve the prompt with your PIN) or upload a photo of a bank or MoMo transfer. MoMo payments count straight away; transfers count once a leader confirms them." },
        { q: "What happens if I pay late?", a: "Each group sets a grace period. After it, the contribution is marked late and the group's late fine is added. You can see open fines on your dashboard and pay them with your next deposit." },
        { q: "Can I pay in advance or only part?", a: "If nothing is due, a deposit pays the next period in advance. Part payments are only possible if your group allows them." },
        { q: "Where is my receipt?", a: "Open Deposits → History and select a payment, then Download receipt. Your full statement is under Reports → My statement." },
      ],
    },
    {
      title: "Loans",
      items: [
        { q: "How much can I borrow?", a: "Your group sets a limit, usually a multiple of your savings. Request a loan from the Loans page: the form shows your maximum, the interest and each installment before you send it." },
        { q: "Who approves my loan?", a: "Depending on your group's rules, the group admin and/or treasurer must approve, and sometimes guarantors must accept. You get a notification at each step." },
        { q: "What if I repay late?", a: "Late installments add the penalty your group set. After a long delay the loan can be marked as defaulted and your guarantors may be asked to pay." },
      ],
    },
    {
      title: "Your group",
      items: [
        { q: "How do I join a group?", a: "Ask the group admin to invite you by email, or find a public group under Groups and ask to join. Some groups approve each request." },
        { q: "How do I leave a group?", a: "Open the group and choose Leave group. You see what you would get back (your savings minus what you owe). A leader pays you and closes your membership." },
        { q: "What is the share-out?", a: "At the end of a cycle the group's profit (interest, fines) is shared in proportion to each member's savings. Reports → Share-out shows a live preview." },
      ],
    },
    {
      title: "Your account",
      items: [
        { q: "I forgot my password", a: "On the sign-in page choose Forgot password. We send a code by email and, if your phone is on your account, by SMS. You can also sign in with an SMS code instead of a password." },
        { q: "How do I protect my account?", a: "Turn on two-step verification in Settings → Security. Group admins and treasurers may be required to use it." },
        { q: "Can I get or delete my data?", a: "Profile → Your data lets you download everything we hold about you, or ask for your account to be deleted." },
      ],
    },
  ],
  rw: [
    {
      title: "Kwizigama no kwishyura",
      items: [
        { q: "Nishyura nte umusanzu wanjye?", a: "Fungura Kwishyura, uhitemo itsinda, wishyure ukoresheje MTN MoMo (wemeza ukoresheje PIN) cyangwa ushyireho ifoto y'ubwishyu bwakozwe kuri banki cyangwa MoMo. Ubwishyu bwa MoMo bubarwa ako kanya; ubundi bubarwa umuyobozi amaze kubwemeza." },
        { q: "Bigenda bite iyo natinze kwishyura?", a: "Buri tsinda rigena igihe cy'imbabazi. Nyuma yacyo, umusanzu ufatwa nk'uwatinze hakongerwaho igihano cy'itsinda. Ibihano bitarishyurwa ubibona ahabanza." },
      ],
    },
    {
      title: "Inguzanyo",
      items: [
        { q: "Nshobora kuguza angahe?", a: "Itsinda rigena urugero, akenshi rukubye ubwizigame bwawe. Saba inguzanyo kuri paji y'Inguzanyo: ifishi ikwereka ingano ntarengwa, inyungu n'ibyo uzajya wishyura." },
        { q: "Ni nde wemeza inguzanyo yanjye?", a: "Bitewe n'amategeko y'itsinda, umuyobozi n'umucungamutungo bagomba kwemeza; rimwe na rimwe n'abishingizi. Ubona ubutumwa kuri buri ntambwe." },
      ],
    },
  ],
  fr: [
    {
      title: "Épargne et paiements",
      items: [
        { q: "Comment payer ma cotisation ?", a: "Ouvrez Versements, choisissez votre groupe et payez par MTN MoMo (vous validez avec votre code PIN) ou envoyez la photo d'un virement. Les paiements MoMo comptent tout de suite ; les virements dès qu'un responsable les confirme." },
        { q: "Que se passe-t-il si je paie en retard ?", a: "Chaque groupe fixe un délai de grâce. Ensuite la cotisation est en retard et l'amende du groupe s'ajoute." },
      ],
    },
    {
      title: "Prêts",
      items: [
        { q: "Combien puis-je emprunter ?", a: "Votre groupe fixe une limite, souvent un multiple de votre épargne. Le formulaire de demande affiche le maximum, les intérêts et chaque échéance." },
      ],
    },
  ],
};

export function HelpPage() {
  const { t, locale } = useI18n();
  const settings = useQuery({
    queryKey: ["platform-public-settings"],
    queryFn: async () => (await apiClient.get("/platform/settings")) as unknown as { supportEmail: string | null },
    staleTime: 3600_000,
  });
  const topics = locale === "en" ? TOPICS.en : [...TOPICS[locale], ...TOPICS.en.slice(TOPICS[locale].length)];
  const email = settings.data?.supportEmail;

  return (
    <main className="pb-5 lg:pt-2">
      <div className="container mx-auto max-w-3xl space-y-4 px-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-[28px] font-semibold leading-tight tracking-[-0.01em] text-text sm:text-[34px]">
            <LifeBuoy className="size-6 text-primary" /> {t("help.title")}
          </h1>
          <p className="mt-1 text-sm text-text-muted">{t("help.subtitle")}</p>
        </div>
        {topics.map((topic) => (
          <section key={topic.title} className="rounded-(--radius) border border-border bg-bg">
            <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-text">{topic.title}</h2>
            <div className="divide-y divide-border">
              {topic.items.map((qa) => (
                <details key={qa.q} className="group px-4 py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-text">
                    {qa.q}
                    <ChevronDown className="size-4 shrink-0 text-text-muted transition group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="mt-2 text-sm text-text-muted">{qa.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
        <p className="text-sm text-text-muted">
          {email ? (
            <>
              {t("help.contact", { email: "" }).replace(/\s*\.$/, "")}{" "}
              <a href={`mailto:${email}`} className="text-primary underline underline-offset-2">
                {email}
              </a>
              .
            </>
          ) : (
            t("help.contactNoEmail")
          )}
        </p>
      </div>
    </main>
  );
}
