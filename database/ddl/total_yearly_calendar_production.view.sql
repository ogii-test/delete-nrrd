CREATE OR REPLACE VIEW "public"."total_yearly_calendar_production" AS 
 SELECT a.period,
    a.year,
    a.product_order,
    a.product,
    a.source,
    a.sort_order,
    sum(a.sum) AS sum
   FROM ( SELECT period.period,
            period.calendar_year AS year,
                CASE
                    WHEN ((commodity.product)::text = 'Oil (bbl)'::text) THEN 1
                    WHEN ((commodity.product)::text = 'Gas (mcf)'::text) THEN 2
                    WHEN ((commodity.product)::text = 'Coal (tons)'::text) THEN 3
                    ELSE 0
                END AS product_order,
            commodity.product,
                CASE
                    WHEN ((location.land_class)::text = 'Mixed Exploratory'::text) THEN 'Mixed Exploratory'::text
                    WHEN (((location.land_class)::text = 'Native American'::text) OR ((location.land_class)::text = 'Native American '::text)) THEN 'Native American'::text
                    WHEN (((location.land_class)::text = 'Federal'::text) AND ((location.land_category)::text = 'Onshore'::text)) THEN 'Federal Onshore'::text
                    WHEN (((location.land_class)::text = 'Federal'::text) AND ((location.land_category)::text = 'Offshore'::text)) THEN 'Federal Offshore'::text
                    ELSE concat('Unknown: ', location.land_class, ' - ', location.land_category)
                END AS source,
                CASE
                    WHEN ((location.land_class)::text = 'Mixed Exploratory'::text) THEN 0
                    WHEN (((location.land_class)::text = 'Native American'::text) OR ((location.land_class)::text = 'Native American '::text)) THEN 1
                    WHEN (((location.land_class)::text = 'Federal'::text) AND ((location.land_category)::text = 'Onshore'::text)) THEN 3
                    WHEN (((location.land_class)::text = 'Federal'::text) AND ((location.land_category)::text = 'Offshore'::text)) THEN 2
                    ELSE 0
                END AS sort_order,
            (sum((production.volume)::double precision))::numeric(20,2) AS sum
           FROM (((production
             JOIN period USING (period_id))
             JOIN location USING (location_id))
             JOIN commodity USING (commodity_id))
          WHERE (((period.period)::text = 'Calendar Year'::text) AND (period.period_date > ( SELECT (max(period_1.period_date) - '10 years'::interval)
                   FROM (production production_1
                     JOIN period period_1 USING (period_id))
                  WHERE ((period_1.period)::text = 'Calendar Year'::text))) AND ((commodity.product)::text = ANY ((ARRAY['Oil (bbl)'::character varying, 'Gas (mcf)'::character varying, 'Coal (tons)'::character varying])::text[])))
          GROUP BY period.period, period.calendar_year, location.land_category, location.land_class, commodity.product,
                CASE
                    WHEN ((commodity.product)::text = 'Oil (bbl)'::text) THEN 1
                    WHEN ((commodity.product)::text = 'Gas (mcf)'::text) THEN 2
                    WHEN ((commodity.product)::text = 'Coal (tons)'::text) THEN 3
                    ELSE 0
                END, commodity.source,
                CASE
                    WHEN ((location.land_class)::text = 'Mixed Exploratory'::text) THEN 0
                    WHEN (((location.land_class)::text = 'Native American'::text) OR ((location.land_class)::text = 'Native American '::text)) THEN 1
                    WHEN (((location.land_class)::text = 'Federal'::text) AND ((location.land_category)::text = 'Onshore'::text)) THEN 3
                    WHEN (((location.land_class)::text = 'Federal'::text) AND ((location.land_category)::text = 'Offshore'::text)) THEN 2
                    ELSE 0
                END) a
  GROUP BY a.period, a.year, a.source, a.sort_order, a.product, a.product_order
  ORDER BY a.period, a.product_order, a.year, a.sort_order;
