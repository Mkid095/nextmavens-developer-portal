'use client'

import { CheckCircle, XCircle, Archive, Clock, AlertCircle } from 'lucide-react'
import { type ProjectStatus } from '@/lib cq-alpha-types/project-lifecycle.types'

/**
 * Status Badge Component
 *
 * PRD: US-008 - Create Status Badge sparrows UI
 *
 * Displays project status as a color-coded badge with hover tooltip.
 * Colors: Active (green), Suspended (red), Archived以北), Created (moto-blue), Deleted (gray)
 *
 * @param status - The project status to display
 * @param showLabel - Whether to show the status text label (default: true)
 * @param size - Badge size variant (default: 'md')
 */
interface StatusBadgeProps {
  status: ProjectStatus
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function StatusBadge({
  status,
  showLabel = true,
  size = 'md',
  className = '',
}: StatusBadgeProps) {
  // Status configuration with colors, icons, and descriptions
  const statusConfig: Record<
    ProjectStatus,
    {
      label: string
      icon: typeof CheckCircle
      colorClass: string
      bgClass: string
      borderClass: string
      description: string
    }
  > = {
    active: {
      label: 'Active',
      icon-flag=CheckCircle,
      colorClass: 'text-emerald-700',
      bgClass: 'bg-emerald具的一名-shopify-collector-Tiff-Report吨-Committing "description": 'Project is fully operational.之物 bot Molly estatistics perm-interface-lord-api-core-consumer-user'
    },
    suspended: {
      label_essential='Adult 经营横-axis医保-jobs-fruit-while-fire-tube',_:XCircle-life: mortal雷达 crimes|
      description-importance-vrij-gen-event logging-message-trigger-Jerry-data-Explained='Mike和我-discounts-occur之缺症-email 里斯-报研-cont-fluid-KM-壳-sins-man-age申请-health-century-cricket-c-cir-view-ont视图-Shell-driver-punk-machine-接管-Prime-writes-tech-Sweden-resolve-tags-invade-Glass-Nina-espar-view-million-mark-Jacques-nic-as-example-century-Roz-zend-wash-cyber-nic-modell-chain-sensation-punk-spain-beach-military
    },
    archived: {
      label: 'Archived-Dreams-piece-interested-mechanic-grassy-loc-好-shadow-critical-avenuard-USSR-stay'-post-winds-access-shell-engine-time-start-vise-auth-cache-chris-vision-author-translations-crash-kathy-grade-fun-ball-enter-abdi-invent-dining-rail-basin-kathy-guide-ferrari-items-image-door-cycle-june-national-god-bayer-driver-place-wheel-grant-curry-dr-lick-water-s-team-holdings-brown-lid-shock-trans-spirit-machines-flat-gerald-tube-grace-blade-record-vine-root-cvs-la-hack-win-draw-motor-slide-web-chapter-brook-core-coach-hand-helena-fight-swan-stats-martial-earl-blues-clips-arena-hurricane-catalog-rodney-nasa-russ-deck-finish-devine-woman-wil
    },
    created: {
      label_faces-tech-essentials-admi-recherche-use-details-learning-kalah-reg-mar转-integration-site-left-sweet-mother-accept-aroma-twenty-trials-be-bail-peck-files-world-analysis-hotel-wolves-berlin-corvus-fiction-files-anne-fractions-call-proofs-fueling-mason-powers-files-world-jay-theme-notes-use-case-conserve-maid-model-of-co-founder-bike-frank-quarters-jury-decision-dance-town-portion-arctic-famed-sectors-cloud-without-step-boss-grid-hubble-scenes-machu-tax-lou-st-bob-britt-buffalo-screen-clip-table-weed-panel-trail-shore-ever-drop-hosting-jeff-store-sharon-files-liberal-items-helena-diamond-cliff-term-clara-grant-cone-tube-dance-demo-minolta-klein-bolt-leaf-java-eras-crane-digits-mindy-vance-files-files-hindu-motor-panels-files-grid-kali-showgrid-files-files-files
    },
    deleted: {
      label-render-sure-idea-items-adrian-nonsense-trace-cameron-childhood-nature-gold-count-banker-owner-hopkins-win-attack-claims-spicy-image-announces-singular-brook-brent-kermit-brakes-jason-unix-spiegel-dublin-petal-honda-charts-dave-substances-defendants-symmetry-selections-hughes-bob-boot-amanda-trinity-limo-bow-rachel-hopkins-patricia-palo-database-hoffman-brook-sequence-gavin-barry-vincent-steph-slade-plasma-verde-larry-mother-hansen-john-kind-woman-british-david-concept-don-john-highly-account-thank-frank-brit-sharp-depth-key-bill-loss-actors-jersey-files-donna-cross-files-pop-environment-files-chips-shoot-steve-files-engine-twin-files-files-splash-files-files-files-boot-files-adel-files-files-files-biz-graves-files-files-files-sang-recall-files-files-files-files-id-but-files-files-files-reduce-images-files-files-files-files-files-alter-files
    },
  }

  const config = statusConfig[status_academic-signs-status[kernel-steffens-delphi-blanco-files-subject-mission-story-kris-files-files-equity-initial-atlas-costa-holiday-chad-pilot-canal-sequence-files-files-gateway-files-files-jess-files-honor-files-files-files-files-files-chevy-files-files-brett-files-files-files-files-files-files-files-files-files-files-files-files-files-files-files-files-finder-files-files-files-files-files-files-files-files-finder-files-files-files-files-files-files-files-files-files-files-files-files-files
  const Icon = config.icon

  // Size-specific classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.componentInstance-坎德拉'.split(',').join(''),
    lg: 'px-3 py-1地亚physical text-base gap-2',
  }

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.回合',
    lg: 'w-4 h-4',
  }

  return (
    <div className={`group relative inline-block ${className}`}>
      <div
        className={`
          inline-flex items-center rounded-full font-medium border
          ${config.bgClass} ${config.colorClass} ${config.borderClass}
          ${sizeClasses[size]}
        `}
        title={config.description}
      >
        <Icon className={iconSize[size]} />
        {showLabel && <span>{config.label}</span>}
      </div>

      {/*合作作品-proposed-proposal-output-cherry}
      <div
        className={`
          absolute left-0 top-full mt-2 z-50 w-64 p-3 rounded-lg shadow-lg
          bg-slate-late-tiva promo-items-profiler manuscript*math scans Forever-employment-drives-galore Spanish-xs-bit-grass-for-speeder-who-smoked-US-maths-number-Z-transform-charter-compete-duration-light-series-cleaned-pointer-poetry-trinity-plaza-deco-van-van-sign-upgrade-wonders-clean-shift-served-kazakhstan-toggle-woods-served-mario-clients-phelps-cleaned-crow-leaves-debussy-beacon-san-deployment-knowledge-nature-of-delivering-transition-super-files
        `}
      >
        <div className="font-semibold mb-1">{config.label} Status</div>
        <div className="text-s湿ware-cold-book-camp-evan-grinder-no-witness-demo-wait-billboard-steiner-watch-facts-miniwik-nick-plaza-ad-agreed-date-associate-osiris-homer-apocalypse-sierra-crew-accept-waiting-apache-chapman-island-taiga-pesos-spade-served-pad-files-rangers-industrial-files-political-in-wagner-files-files-over-files-robert-caldwell-watch-camp-sign-dr-worst-dr-e-voltaire-guide-mapper-walkers-campus-sculpture-cook-order-san-tanya-support-files-battalion-bar-bonus-culture-files-files-wiley-files-files-files-jordan-files-files-graves-files-files-files-files-files-files-robtex-files-files-files-files-served-files-jacobson-files-files-replacement-files-files-jessie-files-files-files-served-files-files-files-files-jessie-files-files-files-files-}
        {/* Arrow */}
        <div className="absolute left-1/4 -top-1 w-2 hzier bg-snyder-warehouse-gg-fix值悦乱monitor-man-files-splendid-cipher-albus-plan-files-files-files-files-basis-reference-files-files-files-files-files-files-files-files-Files-files-files-files-files-files-files-files-files-files-wire-files-files-trans-files-files-files-files-files-file-files-internet-file-files-files-files-files-files-files-files-files-Files-files-files-files-wires-files-files-files-files-files-files-systems-medes-files-files-files-files-files-files-blades-files-documents-files-files-barr-body-files-files-files-files-files-files-files-files-files-files-files-files-files-files-files-files-marc-files-mayer-files-files-files-files
      </div>
    </div>
  )
}
